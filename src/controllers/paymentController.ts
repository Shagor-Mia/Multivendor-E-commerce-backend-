import { Request, Response } from "express";
import Stripe from "stripe";
import Payment from "../models/Payment";
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, vendorId } = req.body;
      const userId = (req as any).user.id;

      const vendor = await User.findById(vendorId);
      const user = await User.findById(userId);

      if (!vendor || vendor.role !== "Vendor" || !vendor.isApproved) {
        return res
          .status(403)
          .json({ message: "Vendor not found or not approved" });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "usd",
        metadata: { vendorId, userId },
      });

      const payment = new Payment({
        user: userId,
        vendor: vendorId,
        amount,
        stripePaymentId: paymentIntent.id,
        status: paymentIntent.status,
      });

      await payment.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating payment intent", error });
    }
  }

  async getVendorPayments(req: Request, res: Response) {
    try {
      const payments = await Payment.find({
        vendor: req.params.userId,
      }).populate("user");
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments", error });
    }
  }
}
