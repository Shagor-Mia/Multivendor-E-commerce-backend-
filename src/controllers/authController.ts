import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import dotenv from "dotenv";
import userSchema from "../validation/userSchema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token"; // Import token utilities
import { generateOtp, sendOtpEmail } from "../utils/otp";
import { uploadToCloudinarySingle } from "../middleware/uploadToCloudinary";

dotenv.config();

export class AuthController {
  async signUp(req: Request, res: Response) {
    try {
      const parseResult = userSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ errors: parseResult.error.issues });
      }

      const { name, email, password, role, storeName } = parseResult.data;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a temporary user object with core data
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || "User",
        storeName: role === "Vendor" ? storeName : undefined,
        isApproved: role === "Vendor" ? false : undefined,
      });

      // If an image is provided, upload it and add the data to the user object
      if (req.file) {
        const uploaded = await uploadToCloudinarySingle(
          req.file,
          `users/${user._id}`
        );
        user.image = uploaded;
      }

      // Save the user document to the database
      await user.save();

      res.status(201).json({
        message:
          role === "Vendor"
            ? "Vendor created successfully, awaiting approval"
            : "User created successfully",
        user,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "Email already registered." });
      }
      console.error("Signup error:", error);
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
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
      const newRefreshToken = generateRefreshToken(
        user._id.toString(),
        user.role
      );
      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

      res.json({ accessToken: newAccessToken });
    } catch (error: any) {
      console.error("Refresh token error:", error);
      // Provide a more specific error message based on the type of error, e.g., jwt.TokenExpiredError
      if (error instanceof require("jsonwebtoken").TokenExpiredError) {
        return res
          .status(403)
          .json({ message: "Refresh token expired. Please log in again." });
      }
      return res
        .status(403)
        .json({ message: "Invalid refresh token", error: error.message });
    }
  }

  // Logout endpoint
  async logout(req: Request, res: Response) {
    try {
      // Clear cookies if you're storing tokens in them
      // Note: For a typical API, you might just instruct the client to delete the tokens.
      // If you're using httpOnly cookies, this is where you'd clear them.
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed", error: error.message });
    }
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

      const { otp, expires } = generateOtp();

      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = expires;
      await user.save();

      // Implement your email sending logic here
      // For testing, you might just log the OTP to the console
      await sendOtpEmail(user.email, otp); // Make sure this utility is properly configured

      res.status(200).json({ message: "OTP sent to your email." });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Error sending password reset OTP",
        error: error.message,
      });
    }
  }

  // reset password functionality
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: Date.now() }, // OTP must not be expired
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
    } catch (error: any) {
      console.error("Reset password error:", error);
      res
        .status(500)
        .json({ message: "Error resetting password", error: error.message });
    }
  }
}
