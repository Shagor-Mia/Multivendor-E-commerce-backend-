import { Router } from "express";

import { authenticateToken } from "../middleware/authMiddleware";
import { ReviewController } from "../controllers/reviewRatingController";

const router = Router();
const reviewController = new ReviewController();
// for all user
router.get(
  "/products/:productId/reviews",
  reviewController.getProductReviews.bind(reviewController)
);
// for logged in user
router.post(
  "/products/:productId/reviews",
  authenticateToken,
  reviewController.addReview.bind(reviewController)
);
router.put(
  "/products/:reviewId",
  authenticateToken,
  reviewController.updateReview.bind(reviewController)
);
router.delete(
  "/products/:reviewId",
  authenticateToken,
  reviewController.deleteReview.bind(reviewController)
);

router.get(
  "/products/:productId/my-review",
  authenticateToken,
  reviewController.getMyReview.bind(reviewController)
);

export default router;
