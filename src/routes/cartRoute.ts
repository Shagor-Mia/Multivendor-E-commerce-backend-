import express from "express";
import { ShoppingCartController } from "../controllers/cartController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();
const cartCtrl = new ShoppingCartController();

router.use(authenticateToken); // All routes require auth

// Get current user's cart
router.get("/", cartCtrl.getCart.bind(cartCtrl));

// Add product or update quantity
router.post("/add", cartCtrl.addItem.bind(cartCtrl));

// Remove product by productId param
router.delete("/remove/:productId", cartCtrl.removeItem.bind(cartCtrl));

// Clear entire cart
router.delete("/clear", cartCtrl.clearCart.bind(cartCtrl));

export default router;
