import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { ShoppingCartController } from "../controllers/cartController";

const router = express.Router();
const cartController = new ShoppingCartController();

// Get current user's cart
router.get("/", authenticateToken, cartController.getCart.bind(cartController));

// Add item to cart
router.post(
  "/",
  authenticateToken,
  cartController.addItem.bind(cartController)
);

// Update quantity of specific product in cart
router.put(
  "/:productId",
  authenticateToken,
  cartController.updateQuantity.bind(cartController)
);

// Remove specific product from cart
router.delete(
  "/:productId",
  authenticateToken,
  cartController.removeItem.bind(cartController)
);

// Clear entire cart
router.delete(
  "/",
  authenticateToken,
  cartController.clearCart.bind(cartController)
);

export default router;
