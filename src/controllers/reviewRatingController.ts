import { Request, Response } from "express";
import Review from "../models/ReviewRating";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

export class ReviewController {
  // ✅ Add review
  async addReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;
      const { rating, review } = req.body;

      if (!userId) {
        return res.status(403).json({ message: "User ID is missing" });
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Prevent duplicate review
      const existingReview = await Review.findOne({
        user: userId,
        product: productId,
      });
      if (existingReview) {
        return res
          .status(400)
          .json({ message: "You already reviewed this product" });
      }

      const newReview = await Review.create({
        user: userId,
        product: productId,
        rating,
        review,
      });

      res
        .status(201)
        .json({ message: "Review added successfully", review: newReview });
    } catch (error) {
      console.error("Add review error:", error);
      res.status(500).json({ message: "Error adding review", error });
    }
  }

  // ✅ Update review
  async updateReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { reviewId } = req.params;
      const { rating, review } = req.body;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const updatedReview = await Review.findOneAndUpdate(
        { _id: reviewId, user: userId },
        { rating, review },
        { new: true }
      );

      if (!updatedReview) {
        return res
          .status(404)
          .json({ message: "Review not found or access denied" });
      }

      res.json({
        message: "Review updated successfully",
        review: updatedReview,
      });
    } catch (error) {
      console.error("Update review error:", error);
      res.status(500).json({ message: "Error updating review", error });
    }
  }

  // ✅ Delete review
  async deleteReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { reviewId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const deletedReview = await Review.findOneAndDelete({
        _id: reviewId,
        user: userId,
      });
      if (!deletedReview) {
        return res
          .status(404)
          .json({ message: "Review not found or access denied" });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ message: "Error deleting review", error });
    }
  }

  // ✅ Get all reviews for a product (with pagination)
  async getProductReviews(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const order = req.query.order === "asc" ? 1 : -1;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const reviews = await Review.find({ product: productId })
        .populate("user", "name email avatar")
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalReviews = await Review.countDocuments({ product: productId });

      res.json({
        total: totalReviews,
        page,
        pages: Math.ceil(totalReviews / limit),
        reviews,
      });
    } catch (error) {
      console.error("Get product reviews error:", error);
      res
        .status(500)
        .json({ message: "Error fetching product reviews", error });
    }
  }

  // ✅ Get logged-in user's review for a product
  async getMyReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;

      if (!userId) {
        return res.status(403).json({ message: "User ID is missing" });
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const myReview = await Review.findOne({
        user: userId,
        product: productId,
      }).populate("user", "name email avatar");

      if (!myReview) {
        return res
          .status(404)
          .json({ message: "You haven't reviewed this product yet" });
      }

      res.json(myReview);
    } catch (error) {
      console.error("Get my review error:", error);
      res.status(500).json({ message: "Error fetching your review", error });
    }
  }
}
