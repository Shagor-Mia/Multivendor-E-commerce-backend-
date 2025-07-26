import { Request, Response } from "express";
import Category from "../models/Category";
import Product from "../models/Product";

export class CategoryController {
  async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const category = new Category({
        name,
        description,
      });

      await category.save();
      res
        .status(201)
        .json({ message: "Category created successfully", category });
    } catch (error) {
      res.status(500).json({ message: "Error creating category", error });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", error });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const category = await Category.findByIdAndUpdate(
        req.params.categoryId,
        { name, description },
        { new: true }
      );
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category updated successfully", category });
    } catch (error) {
      res.status(500).json({ message: "Error updating category", error });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const category = await Category.findByIdAndDelete(req.params.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      await Product.deleteMany({ category: req.params.categoryId });
      res.json({
        message: "Category and associated products deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category", error });
    }
  }
}
