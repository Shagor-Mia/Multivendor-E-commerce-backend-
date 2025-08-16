import { Request, Response } from "express";
import mongoose from "mongoose";
import ShoppingCart from "../models/Cart";
import Product from "../models/Product";

export class ShoppingCartController {
  // Helper to recalc totalPrice and itemsCount
  private async recalculateTotals(cart: any) {
    cart.totalPrice = cart.items.reduce((sum: number, item: any) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    cart.itemsCount = cart.items.reduce((count: number, item: any) => {
      return count + item.quantity;
    }, 0);
  }

  // Get current user's cart
  async getCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      let cart = await ShoppingCart.findOne({ user: userId }).populate({
        path: "items.product",
        select: "name price image stock status",
      });

      if (!cart) {
        cart = await ShoppingCart.create({
          user: userId,
          items: [],
          totalPrice: 0,
          itemsCount: 0,
        });
      }

      res.json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching cart", error });
    }
  }

  // Add item(s) to cart
  async addItem(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      let { items, productId, quantity } = req.body;

      if (!items) {
        if (productId) {
          items = [{ productId, quantity: quantity || 1 }];
        } else {
          return res.status(400).json({ message: "Product ID is required" });
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items array is required" });
      }

      let cart = await ShoppingCart.findOne({ user: userId }).session(session);
      if (!cart) {
        cart = new ShoppingCart({
          user: userId,
          items: [],
          totalPrice: 0,
          itemsCount: 0,
        });
      }

      for (const entry of items) {
        const { productId, quantity } = entry;
        const qty = Number(quantity) || 1;

        if (!productId || qty < 1) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "Invalid product or quantity" });
        }

        const product = await Product.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ message: `Product ${productId} not found` });
        }

        if (product.stock < qty) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Only ${product.stock} in stock for product ${productId}`,
          });
        }

        const existingItem = cart.items.find(
          (i) => i.product.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += qty;
        } else {
          cart.items.push({ product: productId, quantity: qty });
        }

        product.stock -= qty;
        product.status = product.stock > 0 ? "In Stock" : "Stock Out";
        await product.save({ session });
      }

      await cart.populate("items.product");
      await this.recalculateTotals(cart);
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      await cart.populate({
        path: "items.product",
        select: "name price image stock status",
      });

      res.status(200).json({ message: "Items added to cart", cart });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res.status(500).json({ message: "Error adding items to cart", error });
    }
  }

  // Update quantity (increment/decrement)
  async updateQuantity(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { productId } = req.params;
      const { action } = req.body;

      if (!productId || !action) {
        return res
          .status(400)
          .json({ message: "Product ID and action required" });
      }

      const cart = await ShoppingCart.findOne({ user: userId }).session(
        session
      );
      if (!cart) return res.status(404).json({ message: "Cart not found" });

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex === -1)
        return res.status(404).json({ message: "Product not in cart" });

      const product = await Product.findById(productId).session(session);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      let currentQty = cart.items[itemIndex].quantity;

      if (action === "increment") {
        if (product.stock < 1) {
          return res
            .status(400)
            .json({ message: `No stock available for ${product.name}` });
        }
        cart.items[itemIndex].quantity += 1;
        product.stock -= 1;
      } else if (action === "decrement") {
        if (currentQty <= 1) {
          cart.items.splice(itemIndex, 1);
          product.stock += 1;
        } else {
          cart.items[itemIndex].quantity -= 1;
          product.stock += 1;
        }
      } else {
        return res
          .status(400)
          .json({ message: "Invalid action. Use increment or decrement" });
      }

      product.status = product.stock > 0 ? "In Stock" : "Stock Out";
      await product.save({ session });

      await cart.populate("items.product");
      await this.recalculateTotals(cart);
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      await cart.populate({
        path: "items.product",
        select: "name price image stock status",
      });

      res.json({ message: "Cart updated", cart });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res.status(500).json({ message: "Error updating cart", error });
    }
  }

  // Remove specific product from cart
  async removeItem(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { productId } = req.params;
      const cart = await ShoppingCart.findOne({ user: userId }).session(
        session
      );
      if (!cart) return res.status(404).json({ message: "Cart not found" });

      const item = cart.items.find((i) => i.product.toString() === productId);
      if (!item) return res.status(404).json({ message: "Item not in cart" });

      const product = await Product.findById(productId).session(session);
      if (product) {
        product.stock += item.quantity;
        product.status = product.stock > 0 ? "In Stock" : "Stock Out";
        await product.save({ session });
      }

      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
      await cart.populate("items.product");
      await this.recalculateTotals(cart);
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      await cart.populate({
        path: "items.product",
        select: "name price image stock status",
      });

      res.json({ message: "Item removed", cart });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res.status(500).json({ message: "Error removing item", error });
    }
  }

  // Clear cart
  async clearCart(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const cart = await ShoppingCart.findOne({ user: userId }).session(
        session
      );
      if (!cart) return res.status(404).json({ message: "Cart not found" });

      for (const item of cart.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          product.status = product.stock > 0 ? "In Stock" : "Stock Out";
          await product.save({ session });
        }
      }

      cart.items = [];
      cart.totalPrice = 0;
      cart.itemsCount = 0;

      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({ message: "Cart cleared", cart });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res.status(500).json({ message: "Error clearing cart", error });
    }
  }
}
