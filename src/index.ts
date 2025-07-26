import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import morgan from "morgan";

import dbConnection from "./database/connect";

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

dbConnection();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
