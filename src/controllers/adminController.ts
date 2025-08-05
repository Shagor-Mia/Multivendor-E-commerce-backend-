import { Request, Response } from "express";
import User from "../models/User";
import dotenv from "dotenv";
import userSchema from "../validation/userSchema";
import Product from "../models/Product";
import Payment from "../models/Payment";

dotenv.config();

export class AdminController {
  // approve vendor functionality
  async approveVendor(req: Request, res: Response) {
    try {
      const { userId } = req.params; // Destructure userId from params
      const user = await User.findById(userId); // Find first to check role

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== "Vendor") {
        return res.status(400).json({ message: "User is not a vendor." });
      }

      if (user.isApproved) {
        return res.status(409).json({ message: "Vendor is already approved." });
      }

      user.isApproved = true;
      await user.save(); // Save the updated user

      res.json({ message: "Vendor approved successfully", user });
    } catch (error: any) {
      console.error("Error approving vendor:", error);
      res
        .status(500)
        .json({ message: "Error approving vendor", error: error.message });
    }
  }

  // NEW: Get all approved vendors
  async getApprovedVendors(req: Request, res: Response) {
    try {
      // Find users with role 'Vendor' and isApproved true
      const approvedVendors = await User.find({
        role: "Vendor",
        isApproved: true,
      }).select("-password -resetPasswordOtp -resetPasswordExpires");
      res.status(200).json({
        message: "Approved vendors retrieved successfully",
        count: approvedVendors.length,
        vendors: approvedVendors,
      });
    } catch (error: any) {
      console.error("Error fetching approved vendors:", error);
      res.status(500).json({
        message: "Error fetching approved vendors",
        error: error.message,
      });
    }
  }

  // NEW: Get all unapproved vendors
  async getUnapprovedVendors(req: Request, res: Response) {
    try {
      // Find users with role 'Vendor' and isApproved false
      const unapprovedVendors = await User.find({
        role: "Vendor",
        isApproved: false,
      }).select("-password -resetPasswordOtp -resetPasswordExpires");
      res.status(200).json({
        message: "Unapproved vendors retrieved successfully",
        count: unapprovedVendors.length,
        vendors: unapprovedVendors,
      });
    } catch (error: any) {
      console.error("Error fetching unapproved vendors:", error);
      res.status(500).json({
        message: "Error fetching unapproved vendors",
        error: error.message,
      });
    }
  }

  // Admin-only: Get all users with optional filters, sorting, pagination
  async getAllUsers(req: Request, res: Response) {
    try {
      const {
        role,
        isApproved,
        search,
        sortBy = "createdAt",
        order = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      const query: any = {};

      if (role) query.role = role;
      if (isApproved !== undefined) query.isApproved = isApproved === "true";

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = order === "asc" ? 1 : -1;

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(query).sort(sortOptions).skip(skip).limit(Number(limit)),
        User.countDocuments(query),
      ]);

      res.json({
        users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }

  // Admin: Get a single user by ID
  async getSingleUserById(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select(
        "-password -resetPasswordOtp -resetPasswordExpires"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User retrieved successfully",
        user,
      });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res
        .status(500)
        .json({ message: "Error fetching user", error: error.message });
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
  //   Admin can delete an user
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
}
