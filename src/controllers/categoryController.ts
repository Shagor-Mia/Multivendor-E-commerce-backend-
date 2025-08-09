import { Request, Response } from "express";
import Category from "../models/Category";
import mongoose from "mongoose";

export class CategoryController {
  // Create a new category
  async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || !description) {
        res.status(400);
        throw new Error("Category name and description are required");
      }

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        res.status(400);
        throw new Error("Category already exists");
      }

      const category = await Category.create({ name, description });
      res.status(201).json(category);
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: error.message || "Internal Server Error",
      });
    }
  }

  // Get all categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await Category.find({});
      res.status(200).json(categories);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Error fetching categories" });
    }
  }

  // Get category by ID
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid category ID");
      }

      const category = await Category.findById(id);

      if (!category) {
        res.status(404);
        throw new Error("Category not found");
      }

      res.status(200).json(category);
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: error.message || "Error fetching category",
      });
    }
  }

  // Update category by ID
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid category ID");
      }

      if (!name || !description) {
        res.status(400);
        throw new Error("Category name and description are required");
      }

      const existingCategory = await Category.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingCategory) {
        res.status(400);
        throw new Error("Another category with this name already exists");
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, description },
        { new: true, runValidators: true }
      );

      if (!updatedCategory) {
        res.status(404);
        throw new Error("Category not found");
      }

      res.status(200).json(updatedCategory);
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: error.message || "Error updating category",
      });
    }
  }

  // Delete category by ID
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid category ID");
      }

      const deletedCategory = await Category.findByIdAndDelete(id);

      if (!deletedCategory) {
        res.status(404);
        throw new Error("Category not found");
      }

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: error.message || "Error deleting category",
      });
    }
  }
}
