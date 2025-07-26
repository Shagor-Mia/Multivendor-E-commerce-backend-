import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import userSchema from "../validation/userSchema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token"; // Import token utilities

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class AuthController {
  async signUp(req: Request, res: Response) {
    try {
      const parseResult = userSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ errors: parseResult.error.issues });
      }
      const { name, email, password, role, storeName } = parseResult.data;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || "User",
        storeName: role === "Vendor" ? storeName : undefined,
        isApproved: role === "Vendor" ? false : undefined,
      });

      await user.save();
      res.status(201).json({
        message:
          role === "Vendor"
            ? "Vendor created successfully, awaiting approval"
            : "User created successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  }
  // approve vendor functionality
  async approveVendor(req: Request, res: Response) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isApproved: true },
        { new: true }
      );
      if (!user || user.role !== "Vendor") {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json({ message: "Vendor approved successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Error approving vendor", error });
    }
  }

  // Login functionality
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "Vendor" && !user.isApproved) {
        return res
          .status(403)
          .json({ message: "Vendor account is awaiting approval." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      user.lastLogin = new Date();
      await user.save();

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString(), user.role);

      res.json({
        accessToken,
        refreshToken,
        role: user.role,
        userId: user._id,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error logging in", error });
    }
  }

  // New endpoint for refreshing tokens
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
      // Use verifyRefreshToken to decode the refresh token
      const decoded: any = verifyRefreshToken(refreshToken);

      // Ensure the decoded token has id and role
      if (!decoded || !decoded.id || !decoded.role) {
        return res
          .status(403)
          .json({ message: "Invalid refresh token structure" });
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        return res
          .status(403)
          .json({ message: "Invalid refresh token - user not found" });
      }

      // Generate a new access token using the user's ID and role from the decoded refresh token
      const newAccessToken = generateAccessToken(
        user._id.toString(),
        user.role
      );

      // Optionally, if you want to rotate refresh tokens (recommended for better security)
      // const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);
      // res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Refresh token error:", error);
      // Provide a more specific error message based on the type of error, e.g., jwt.TokenExpiredError
      if (error instanceof require("jsonwebtoken").TokenExpiredError) {
        return res
          .status(403)
          .json({ message: "Refresh token expired. Please log in again." });
      }
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  }
  // Logout endpoint
  async logout(req: Request, res: Response) {
    res.status(200).json({ message: "Logged out successfully" });
  }

  // Password forget functionality
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User with that email does not exist." });
      }

      const otp = crypto
        .randomBytes(3)
        .toString("hex")
        .slice(0, 6)
        .toUpperCase();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = otpExpires;
      await user.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset OTP",
        text: `You requested a password reset. Your OTP is: ${otp}. This OTP is valid for 10 minutes.`,
        html: `<p>You requested a password reset. Your OTP is: <strong>${otp}</strong>.</p><p>This OTP is valid for 10 minutes.</p>`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "OTP sent to your email." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ message: "Error sending password reset OTP", error });
    }
  }
  // reset password functionality
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res
        .status(200)
        .json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password", error });
    }
  }
}
