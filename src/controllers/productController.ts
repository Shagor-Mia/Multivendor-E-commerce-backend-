import { Request, Response } from "express";
import Product from "../models/Product";
import Category from "../models/Category";
import {
  deleteFromCloudinary,
  uploadToCloudinarySingle,
} from "../middleware/uploadToCloudinary";
import { AuthRequest } from "../middleware/authMiddleware";

export class ProductController {
  // ✅ The 'req' parameter now uses the AuthRequest interface
  async createProduct(req: AuthRequest, res: Response) {
    try {
      // ✅ Now includes 'stock' from the request body
      const { name, description, price, discount, status, category, stock } =
        req.body;
      const vendorId = req.user?.id;

      if (!vendorId) {
        return res.status(403).json({ message: "Vendor ID is missing." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required." });
      }

      const uploadResult = await uploadToCloudinarySingle(
        req.file,
        "product-images"
      );

      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        await deleteFromCloudinary(uploadResult.public_id);
        return res.status(400).json({ message: "Invalid category" });
      }

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
        vendor: vendorId,
        // ✅ The stock value is explicitly converted to a number here
        stock: Number(stock),
      });

      res.status(201).json({ message: "Product created", product });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Error creating product", error });
    }
  }

  async getSingleVendorProduct(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.id;
      const { productId } = req.params;

      if (!vendorId) {
        return res.status(403).json({ message: "Vendor ID is missing." });
      }

      // Find the product by its ID and ensure it belongs to the authenticated vendor
      const product = await Product.findOne({
        _id: productId,
        vendor: vendorId,
      })
        .populate("category", "name")
        .populate("vendor", "name email");

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found or not owned by this vendor." });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error("Get single product error:", error);
      res.status(500).json({ message: "Error fetching product", error });
    }
  }

  async getAllVendorProducts(req: AuthRequest, res: Response) {
    try {
      // Get the vendor's ID from the authenticated user
      const vendorId = req.user?.id;
      if (!vendorId) {
        return res.status(403).json({ message: "Vendor ID is missing." });
      }

      const products = await Product.find({ vendor: vendorId })
        .populate("category", "name")
        .populate("vendor", "name email");

      if (products.length === 0) {
        return res
          .status(404)
          .json({ message: "No products found for this vendor." });
      }

      res.json(products);
    } catch (error) {
      console.error("Get vendor products error:", error);
      res
        .status(500)
        .json({ message: "Error fetching vendor products", error });
    }
  }

  // ✅ The 'req' parameter now uses the AuthRequest interface
  async updateProduct(req: AuthRequest, res: Response) {
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
      const vendorId = req.user?.id;

      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.vendor.toString() !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
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

  // ✅ The 'req' parameter now uses the AuthRequest interface
  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.id;
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.vendor.toString() !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
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
