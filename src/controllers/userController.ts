import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import Payment from "../models/Payment";
import bcrypt from "bcrypt";
import userSchema from "../validation/userSchema";
import {
  deleteFromCloudinary,
  uploadToCloudinarySingle,
} from "../middleware/uploadToCloudinary";

export class UserController {
  async getUsers(req: Request, res: Response) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;

      if (authUser.id !== req.params.userId) {
        return res.status(403).json({
          message: "Access denied: Cannot update another user's profile.",
        });
      }

      const parseResult = userSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ errors: parseResult.error.issues });
      }

      const { name, email, password, removeImage } = parseResult.data;
      let updateData: any = { name, email };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Remove image if requested
      if (removeImage?.toString() === "true") {
        if (user.image?.public_id) {
          await deleteFromCloudinary(user.image.public_id);
          updateData.image = undefined;
        }
      }

      // ✅ Upload new image if provided
      if (req.file) {
        if (user.image?.public_id) {
          await deleteFromCloudinary(user.image.public_id); // delete old
        }

        const uploaded = await uploadToCloudinarySingle(
          req.file,
          `users/${user._id}`
        );
        updateData.image = { url: uploaded.url, public_id: uploaded.public_id };
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        updateData,
        {
          new: true,
        }
      );

      res.json({
        message: "User profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Error updating user profile", error });
    }
  }

  // ... rest of the class
}
