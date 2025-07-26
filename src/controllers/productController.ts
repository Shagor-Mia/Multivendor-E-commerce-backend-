import { Request, Response } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import Category from '../models/Category';

export class ProductController {
  async createProduct(req: Request, res: Response) {
    try {
      const { name, description, price, stock, category } = req.body;
      const vendorId = (req as any).user.id;
      const vendor = await User.findById(vendorId);
      const categoryExists = await Category.findById(category);
      if (!vendor || vendor.role !== 'Vendor' || !vendor.isApproved) {
        return res.status(403).json({ message: 'Vendor not found or not approved' });
      }
      if (!categoryExists) {
        return res.status(404).json({ message: 'Category not found' });
      }
      const product = new Product({
        name,
        description,
        price,
        vendor: vendorId,
        category,
        stock
      });

      await product.save();
      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      res.status(500).json({ message: 'Error creating product', error });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const products = await Product.find().populate('vendor').populate('category');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products', error });
    }
  }

  async getVendorProducts(req: Request, res: Response) {
    try {
      const products = await Product.find({ vendor: req.params.userId }).populate('vendor').populate('category');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching vendor products', error });
    }
  }

  async getCategoryProducts(req: Request, res: Response) {
    try {
      const products = await Product.find({ category: req.params.categoryId }).populate('vendor').populate('category');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching category products', error });
    }
  }
}