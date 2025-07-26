import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import Payment from "../models/Payment";
import bcrypt from "bcrypt";
import userSchema from "../validation/userSchema";

export class UserController {
  // async createUser(req: Request, res: Response) {
  //   try {
  //     const parseResult = userSchema.safeParse(req.body);
  //     if (!parseResult.success) {
  //       return res.status(400).json({ errors: parseResult.error.issues });
  //     }
  //     const { name, email, password, role, storeName } = parseResult.data;
  //     const hashedPassword = await bcrypt.hash(password, 10);

  //     const user = new User({
  //       name,
  //       email,
  //       password: hashedPassword,
  //       role: role || "User",
  //       storeName: role === "Vendor" ? storeName : undefined,
  //       isApproved: role === "Vendor" ? false : undefined,
  //     });

  //     await user.save();
  //     res.status(201).json({
  //       message:
  //         role === "Vendor"
  //           ? "Vendor created successfully, awaiting approval"
  //           : "User created successfully",
  //       user,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: "Error creating user", error });
  //   }
  // }
  async getUsers(req: Request, res: Response) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await Product.deleteMany({ vendor: req.params.userId });
      await Payment.deleteMany({
        $or: [{ user: req.params.userId }, { vendor: req.params.userId }],
      });
      res.json({ message: "User and associated data deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }

  // async approveVendor(req: Request, res: Response) {
  //   try {
  //     const user = await User.findByIdAndUpdate(
  //       req.params.userId,
  //       { isApproved: true },
  //       { new: true }
  //     );
  //     if (!user || user.role !== "Vendor") {
  //       return res.status(404).json({ message: "Vendor not found" });
  //     }
  //     res.json({ message: "Vendor approved successfully", user });
  //   } catch (error) {
  //     res.status(500).json({ message: "Error approving vendor", error });
  //   }
  // }
  // update user profile
  async updateUser(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      // Ensure user can only update their own profile
      if (authUser.id !== req.params.userId) {
        return res.status(403).json({
          message: "Access denied: Cannot update another user's profile.",
        });
      }

      const parseResult = userSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ errors: parseResult.error.issues });
      }

      // Destructure only allowed fields for regular users
      const { name, email, password } = parseResult.data;
      let updateData: any = { name, email };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await User.findByIdAndUpdate(req.params.userId, updateData, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User profile updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Error updating user profile", error });
    }
  }
  // Admin update user(vendor) profile
  async adminUpdateUser(req: Request, res: Response) {
    try {
      // This route should always be restricted to Admin by middleware
      const { userId } = req.params;
      const parseResult = userSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ errors: parseResult.error.issues });
      }

      const { role, storeName, isApproved } = parseResult.data; // Include isApproved if you want to update it here too

      let updateData: any = {};
      if (role !== undefined) {
        // Allow updating role
        updateData.role = role;
        if (role === "Vendor") {
          updateData.storeName = storeName; // Only set storeName if new role is Vendor
        } else {
          updateData.storeName = undefined; // Clear storeName if not a Vendor
        }
      }
      if (isApproved !== undefined) {
        // Allow updating approval status
        updateData.isApproved = isApproved;
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User (Admin) updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Error updating user (Admin)", error });
    }
  }

  // ... rest of the class
}
