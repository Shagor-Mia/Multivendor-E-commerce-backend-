import express from "express";
import { ReviewController } from "../controllers/reviewRatingController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();
const reviewController = new ReviewController();

// Add or update review by product ID
router.post("/:productId/review", authenticateToken, (req, res) =>
  reviewController.addOrUpdateReview(req, res)
);

// Delete review by product ID (for current user)
router.delete("/:productId/review", authenticateToken, (req, res) =>
  reviewController.deleteReview(req, res)
);

// Get all reviews for a product
router.get("/:productId/reviews", authenticateToken, (req, res) =>
  reviewController.getProductReviews(req, res)
);

export default router;
