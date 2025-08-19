import express, { Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import dbConnection from "./database/connect";

// Routes
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import ratingRoutes from "./routes/reviewRatting";
import cartRoutes from "./routes/cartRoute";
import orderRoutes from "./routes/orderRoute";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import categoryRoutes from "./routes/categoryRoutes";

import { stripeWebhookHandler } from "./controllers/webhookController";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// Connect DB
dbConnection();

// ✅ Stripe webhook (must be BEFORE express.json())
// Use express.raw() to capture the raw request body for Stripe
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

// Standard middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Routes
app.get("/", (req: Request, res: Response) => res.send("Hello World!"));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
