import { Request, Response } from "express";
import ShoppingCart from "../models/Cart";
import Product from "../models/Product";

export class ShoppingCartController {
  // Get cart for logged-in user
  async getCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      let cart = await ShoppingCart.findOne({ user: userId }).populate({
        path: "items.product",
        select: "name price image",
      });

      if (!cart) {
        // Create empty cart if not exists
        cart = await ShoppingCart.create({ user: userId, items: [] });
      }

      res.json(cart);
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ message: "Error fetching cart", error });
    }
  }

  // Add product or update quantity in cart
  async addItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId, quantity } = req.body;

      if (!productId || quantity < 1) {
        return res.status(400).json({ message: "Invalid product or quantity" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let cart = await ShoppingCart.findOne({ user: userId });

      if (!cart) {
        cart = new ShoppingCart({ user: userId, items: [] });
      }

      // Check if product already in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();

      // Populate product details before sending response
      await cart.populate({
        path: "items.product",
        select: "name price image",
      });

      res.json({ message: "Product added/updated in cart", cart });
    } catch (error) {
      console.error("Add item error:", error);
      res.status(500).json({ message: "Error adding item to cart", error });
    }
  }

  // Remove product from cart
  async removeItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId } = req.params;

      const cart = await ShoppingCart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );

      await cart.save();

      await cart.populate({
        path: "items.product",
        select: "name price image",
      });

      res.json({ message: "Product removed from cart", cart });
    } catch (error) {
      console.error("Remove item error:", error);
      res.status(500).json({ message: "Error removing item from cart", error });
    }
  }

  // Clear the entire cart
  async clearCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;

      const cart = await ShoppingCart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      cart.items = [];
      await cart.save();

      res.json({ message: "Cart cleared", cart });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({ message: "Error clearing cart", error });
    }
  }
}
