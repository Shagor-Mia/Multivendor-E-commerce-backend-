import express from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import ratingRoutes from "./routes/reviewRatting";
import paymentRoutes from "./routes/paymentRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import morgan from "morgan";
import cors from "cors";

import dbConnection from "./database/connect";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(
  "/api/payments", // Correct path to your webhook
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // You can add your webhook handler here directly or in its own file
    const { stripeWebhookHandler } = require("./controllers/webhookController");
    stripeWebhookHandler(req, res);
  }
);
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

dbConnection();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
