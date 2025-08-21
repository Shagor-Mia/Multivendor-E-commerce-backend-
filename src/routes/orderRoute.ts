// routes/orderRoutes.ts
import express from "express";
import { OrderController } from "../controllers/orderController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();
const orderController = new OrderController();

// Create order + PaymentIntent
router.post("/create", authenticateToken, (req, res) =>
  orderController.createOrder(req, res)
);
// routes/orderRoutes.ts
router.get("/:orderId/status", authenticateToken, (req, res) =>
  orderController.getOrderStatus(req, res)
);
// ✅ Get all orders for logged-in user
router.get("/myOrders", authenticateToken, (req, res) =>
  orderController.getMyOrders(req, res)
);
// ✅ Admin endpoints
router.get("/all", authenticateToken, restrictTo("Admin"), (req, res) =>
  orderController.getAllOrders(req, res)
);
export default router;
