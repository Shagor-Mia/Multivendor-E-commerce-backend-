// controllers/webhookController.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../config/stripe";
import Order from "../models/Order";
import ShoppingCart from "../models/Cart";
import Product from "../models/Product";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig!,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const order = await Order.findOne({ paymentIntentId: pi.id }).populate(
          "items.product"
        );
        if (order) {
          order.paymentStatus = "paid";
          order.status = "paid";
          await order.save();

          // ✅ Clear cart after payment success
          await ShoppingCart.findOneAndUpdate(
            { user: order.user },
            { items: [], totalPrice: 0, itemsCount: 0 }
          );
        }
      } catch (err) {
        console.error("Error handling payment_intent.succeeded:", err);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const order = await Order.findOne({ paymentIntentId: pi.id }).populate(
          "items.product"
        );
        if (order) {
          order.paymentStatus = "failed";
          order.status = "cancelled";
          await order.save();

          // ✅ Restore stock because payment failed
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock += item.quantity;
              product.status = product.stock > 0 ? "In Stock" : "Stock Out";
              await product.save();
            }
          }
        }
      } catch (err) {
        console.error("Error handling payment_intent.payment_failed:", err);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};
