import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import Payment from "../models/Payment";
import bcrypt from "bcrypt";
import userSchema from "../validation/userSchema";

export class UserController {
  async createUser(req: Request, res: Response) {
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
}
