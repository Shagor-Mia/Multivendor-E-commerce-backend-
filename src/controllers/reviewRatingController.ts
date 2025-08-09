import { Request, Response } from "express";
import Review from "../models/ReviewRating";
import Product from "../models/Product";
import mongoose from "mongoose";

export class ReviewController {
  // Add or update review (one review per user per product)
  async addOrUpdateReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id; // assuming auth middleware sets req.user
      const { productId } = req.params;
      const { rating, review } = req.body;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be 1 to 5" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Upsert: find existing review by user/product, update or create
      const reviewDoc = await Review.findOneAndUpdate(
        { user: userId, product: productId },
        { rating, review },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({ message: "Review saved", review: reviewDoc });
    } catch (error) {
      console.error("Add/update review error:", error);
      res.status(500).json({ message: "Error saving review", error });
    }
  }

  // Delete review
  async deleteReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const review = await Review.findOneAndDelete({
        user: userId,
        product: productId,
      });
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json({ message: "Review deleted" });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ message: "Error deleting review", error });
    }
  }

  // Get all reviews for a product
  async getProductReviews(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const reviews = await Review.find({ product: productId }).populate(
        "user",
        "name email"
      );

      res.json(reviews);
    } catch (error) {
      console.error("Get product reviews error:", error);
      res.status(500).json({ message: "Error fetching reviews", error });
    }
  }
}
