import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import Product from "../models/Product";
import Category from "../models/Category";
import {
  deleteFromCloudinary,
  uploadToCloudinarySingle,
} from "../middleware/uploadToCloudinary";

export class ProductController {
  async createProduct(req: Request, res: Response) {
    try {
      const { name, description, price, discount, status, category } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required." });
      }

      // Upload image to Cloudinary via helper (which deletes local file)
      const uploadResult = await uploadToCloudinarySingle(
        req.file,
        "product-images"
      );

      // Validate category
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        await deleteFromCloudinary(uploadResult.public_id);
        return res.status(400).json({ message: "Invalid category" });
      }

      // Create product with image as an object
      const product = await Product.create({
        name,
        description,
        price,
        discount,
        image: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        },
        status,
        category,
      });

      res.status(201).json({ message: "Product created", product });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Error creating product", error });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        price,
        discount,
        stock,
        status,
        category,
        removeImage,
      } = req.body;

      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData: any = {
        name: name ?? product.name,
        description: description ?? product.description,
        price: price ?? product.price,
        discount: discount ?? product.discount,
        stock: stock ?? product.stock,
        status: status ?? product.status,
        category: category ?? product.category,
      };

      // Remove image if requested
      if (removeImage?.toString() === "true" && product.image?.public_id) {
        await deleteFromCloudinary(product.image.public_id);
        updateData.image = undefined;
      }

      // Upload new image if provided
      if (req.file) {
        if (product.image?.public_id) {
          await deleteFromCloudinary(product.image.public_id);
        }

        const uploaded = await uploadToCloudinarySingle(
          req.file,
          `products/${product._id}`
        );
        updateData.image = {
          url: uploaded.url,
          public_id: uploaded.public_id,
        };
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.productId,
        updateData,
        { new: true }
      );

      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Error updating product", error });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const { category, search, minPrice, maxPrice, sortBy, order } = req.query;

      const query: any = {};

      if (category) {
        if (!Category.base.Types.ObjectId.isValid(category as string)) {
          return res
            .status(400)
            .json({ message: "Invalid category ID format" });
        }
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Category not found" });
        }
        query.category = category;
      }

      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      let sortQuery: any = {};
      if (sortBy) {
        const sortField = sortBy.toString();
        const sortOrder = order === "desc" ? -1 : 1;
        sortQuery[sortField] = sortOrder;
      } else {
        sortQuery = { createdAt: -1 };
      }

      const products = await Product.find(query)
        .populate("category", "name")
        .populate("vendor", "name email")
        .sort(sortQuery);

      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Error fetching products", error });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.image?.public_id) {
        await deleteFromCloudinary(product.image.public_id);
      }

      await product.deleteOne();

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Error deleting product", error });
    }
  }
}
