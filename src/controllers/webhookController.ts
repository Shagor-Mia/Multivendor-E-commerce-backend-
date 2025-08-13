import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../config/stripe";
import Order from "../models/Order";
import ShoppingCart from "../models/Cart";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;

  try {
    // `req.body` must be raw Buffer (see Express config)
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig!,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const order = await Order.findOne({ paymentIntentId: pi.id });
        if (order) {
          order.paymentStatus = "paid";
          order.status = "paid";
          await order.save();

          // Clear user's cart after payment
          await ShoppingCart.findOneAndUpdate(
            { user: order.user },
            { items: [], totalPrice: 0 }
          );
        }
      } catch (err) {
        console.error("Error updating order on payment_intent.succeeded:", err);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const order = await Order.findOne({ paymentIntentId: pi.id });
        if (order) {
          order.paymentStatus = "failed";
          order.status = "cancelled";
          await order.save();
        }
      } catch (err) {
        console.error("Error updating order on payment_failed:", err);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
      break;
  }

  res.json({ received: true });
};
