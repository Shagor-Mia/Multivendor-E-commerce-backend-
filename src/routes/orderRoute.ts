import express from "express";
import { stripeWebhookHandler } from "../controllers/webhookController";
import { OrderController } from "../controllers/OrderController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();
const orderController = new OrderController();

// create order + PaymentIntent
router.post("/create", authenticateToken, (req, res) =>
  orderController.createOrder(req, res)
);

// webhook: must use raw body parser when mounting route in server
// router.post("/webhook", stripeWebhookHandler);

export default router;
