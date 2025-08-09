import express from "express";
import upload from "../middleware/uploadToServer";
import { ProductController } from "../controllers/productController";

const router = express.Router();
const productController = new ProductController();

// Create product with image upload middleware
router.post(
  "/",
  upload.single("image"), // 'image' is the form field name for file upload
  (req, res) => productController.createProduct(req, res)
);

// Update product with optional image upload
router.put("/:productId", upload.single("image"), (req, res) =>
  productController.updateProduct(req, res)
);

// Get products with filters and sorting (query params)
router.get("/", (req, res) => productController.getProducts(req, res));

// Delete product
router.delete("/:productId", (req, res) =>
  productController.deleteProduct(req, res)
);

export default router;
