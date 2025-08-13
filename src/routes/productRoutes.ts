import { Router } from "express";
import upload from "../middleware/uploadToServer";
import { ProductController } from "../controllers/productController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";
import { Role } from "../models/User";

const router = Router();
const productController = new ProductController();

// Vendor-specific routes
router.post(
  "/",
  authenticateToken,
  restrictTo(Role.Vendor),
  upload.single("image"),
  productController.createProduct.bind(productController)
);

// Route to get a vendor's own products
router.get(
  "/my-products",
  authenticateToken,
  restrictTo(Role.Vendor),
  productController.getAllVendorProducts.bind(productController)
);
// Route to get a single product for the authenticated vendor
router.get(
  "/:productId",
  authenticateToken,
  restrictTo(Role.Vendor),
  productController.getSingleVendorProduct.bind(productController)
);

router.put(
  "/:productId",
  authenticateToken,
  restrictTo(Role.Vendor),
  upload.single("image"),
  productController.updateProduct.bind(productController)
);

router.delete(
  "/:productId",
  authenticateToken,
  restrictTo(Role.Vendor),
  productController.deleteProduct.bind(productController)
);

// Public route to get products (anyone can view)
router.get("/", productController.getProducts.bind(productController));

export default router;
