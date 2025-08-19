// controllers/webhookController.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../config/stripe";
import Order from "../models/Order";
import ShoppingCart from "../models/Cart";
import Product from "../models/Product";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Stripe requires raw body
    event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    console.log("✅ Webhook received:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("💰 PaymentIntent succeeded:", pi.id);

        const orderId = pi.metadata.orderId;
        const order = await Order.findById(orderId);
        if (!order) {
          console.warn(
            "⚠️ No order found for PaymentIntent:",
            pi.id,
            "Order ID:",
            orderId
          );
          break;
        }

        // Update order status
        order.paymentStatus = "paid";
        order.status = "paid";
        order.paymentIntentId = pi.id; // save just in case
        await order.save();
        console.log(`✅ Order ${order._id} marked as PAID`);

        // Clear user's cart
        const cart = await ShoppingCart.findOneAndUpdate(
          { user: order.user },
          { items: [], itemsCount: 0, totalPrice: 0 },
          { new: true }
        );
        if (cart) console.log(`🛒 Cart cleared for user ${order.user}`);
        else console.warn(`⚠️ No cart found for user ${order.user}`);

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("❌ PaymentIntent failed:", pi.id);

        const orderId = pi.metadata.orderId;
        const order = await Order.findById(orderId).populate("items.product");
        if (!order) {
          console.warn(
            "⚠️ No order found for failed PaymentIntent:",
            pi.id,
            "Order ID:",
            orderId
          );
          break;
        }

        // Update order status
        order.paymentStatus = "failed";
        order.status = "cancelled";
        order.paymentIntentId = pi.id; // save just in case
        await order.save();
        console.log(`⚠️ Order ${order._id} marked as FAILED/CANCELLED`);

        // Restore stock for products
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            product.status = product.stock > 0 ? "In Stock" : "Stock Out";
            await product.save();
            console.log(
              `🔄 Restored stock for product ${product._id}: +${item.quantity}`
            );
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Error processing Stripe webhook:", err);
    res.status(500).send("Webhook processing error");
  }
};
