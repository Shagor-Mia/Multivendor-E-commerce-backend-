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

      // ✅ Ensure both addresses are provided
      if (!shippingAddress || !billingAddress) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: "Shipping and billing addresses are required" });
      }

      // load cart with product details
      const cart = await ShoppingCart.findOne({ user: userId }).populate(
        "items.product",
        "price name"
      );

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Cart is empty" });
      }

      // build order items and calculate total
      const orderItems = [];
      let total = 0;
      for (const ci of cart.items) {
        const product = ci.product as any;
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "One of the cart products was not found" });
        }
        const price = product.price;
        orderItems.push({
          product: product._id,
          quantity: ci.quantity,
          price,
        });
        total += price * ci.quantity;
      }

      // create order record
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

      // create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: process.env.STRIPE_CURRENCY || "usd",
        metadata: {
          userId: userId.toString(),
          orderId: order._id.toString(),
        },
      });

      // attach paymentIntentId to order
      order.paymentIntentId = paymentIntent.id;
      await order.save({ session });

      // commit transaction (order + paymentIntent ID saved)
      await session.commitTransaction();
      session.endSession();

      // ✅ Clear the shopping cart (outside transaction to avoid rollback)
      await ShoppingCart.updateOne({ user: userId }, { $set: { items: [] } });

      // send response
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
}
