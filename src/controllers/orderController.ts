// controllers/OrderController.ts
import { Request, Response } from "express";
import ShoppingCart from "../models/Cart";
import Product from "../models/Product";
import Order from "../models/Order";
import stripe from "../config/stripe";
import mongoose from "mongoose";

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = (req as any).user._id as mongoose.Types.ObjectId;
      const { shippingAddress, billingAddress } = req.body;

      if (!shippingAddress || !billingAddress) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: "Shipping and billing addresses are required" });
      }

      // Load cart with product details
      const cart = await ShoppingCart.findOne({ user: userId })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Cart is empty" });
      }

      const orderItems: any[] = [];
      let total = 0;

      // Reserve stock and calculate total
      for (const ci of cart.items) {
        const product = ci.product as any;
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "One of the cart products was not found" });
        }

        const price = product.finalPrice || product.price; // Use discounted price if any

        if (product.stock < ci.quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Insufficient stock for product ${product.name}`,
          });
        }

        // Reserve stock
        product.stock -= ci.quantity;
        product.status = product.stock > 0 ? "In Stock" : "Stock Out";
        await product.save({ session });

        orderItems.push({
          product: product._id,
          quantity: ci.quantity,
          price,
        });
        total += price * ci.quantity;
      }

      // Create order record
      const [order] = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            totalAmount: total,
            paymentStatus: "unpaid",
            status: "pending",
            shippingAddress,
            billingAddress,
          },
        ],
        { session }
      );

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: process.env.STRIPE_CURRENCY || "usd",
        metadata: {
          userId: userId.toString(),
          orderId: order._id.toString(),
        },
      });

      // Attach PaymentIntent to order
      order.paymentIntentId = paymentIntent.id;
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      // ✅ Cart clearing will happen in webhook after payment success

      res.status(201).json({
        orderId: order._id,
        clientSecret: paymentIntent.client_secret,
        amount: total,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("createOrder error:", err);
      res.status(500).json({ message: "Unable to create order", error: err });
    }
  }

  // ✅ Get full order status/details
  async getOrderStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id as mongoose.Types.ObjectId;
      const { orderId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await Order.findOne({
        _id: orderId,
        user: userId,
      }).populate("items.product", "name price image stock status");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        items: order.items.map((i) => ({
          productId: i.product._id,
          name: (i.product as any).name,
          price: i.price,
          quantity: i.quantity,
          image: (i.product as any).image,
          stock: (i.product as any).stock,
          status: (i.product as any).status,
        })),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    } catch (err) {
      console.error("getOrderStatus error:", err);
      res
        .status(500)
        .json({ message: "Error fetching order status", error: err });
    }
  }

  // ✅ Get all orders for logged-in user
  async getMyOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id as mongoose.Types.ObjectId;

      const orders = await Order.find({ user: userId })
        .populate("items.product", "name price image")
        .sort({ createdAt: -1 }); // newest first

      res.json(
        orders.map((order) => ({
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          itemsCount: order.items.length,
          items: order.items.map((i) => ({
            productId: i.product._id,
            name: (i.product as any).name,
            price: i.price,
            quantity: i.quantity,
            image: (i.product as any).image,
          })),
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }))
      );
    } catch (err) {
      console.error("getMyOrders error:", err);
      res.status(500).json({ message: "Error fetching orders", error: err });
    }
  }

  // ✅ Admin: Get all orders (optionally filter by status, user, etc.)
  async getAllOrders(req: Request, res: Response) {
    try {
      const { status, userId } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
        filter.user = new mongoose.Types.ObjectId(userId as string);
      }

      const orders = await Order.find(filter)
        .populate("user", "name email")
        .populate("items.product", "name price image")
        .sort({ createdAt: -1 });

      res.json(
        orders.map((order) => ({
          orderId: order._id,
          user: {
            id: (order.user as any)._id,
            name: (order.user as any).name,
            email: (order.user as any).email,
          },
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          items: order.items.map((i) => ({
            productId: i.product._id,
            name: (i.product as any).name,
            price: i.price,
            quantity: i.quantity,
            image: (i.product as any).image,
          })),
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }))
      );
    } catch (err) {
      console.error("getAllOrders error:", err);
      res.status(500).json({ message: "Error fetching orders", error: err });
    }
  }
}
