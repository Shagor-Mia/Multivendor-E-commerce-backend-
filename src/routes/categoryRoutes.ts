import express from "express";
import { CategoryController } from "../controllers/categoryController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";
import { Role } from "../models/User";

const router = express.Router();
const controller = new CategoryController();

router.post(
  "/",
  authenticateToken,
  restrictTo(Role.Admin),
  controller.createCategory.bind(controller)
);
router.get(
  "/",
  authenticateToken,
  restrictTo(Role.Admin),
  controller.getCategories.bind(controller)
);
router.get(
  "/:id",
  authenticateToken,
  restrictTo(Role.Admin),
  controller.getCategoryById.bind(controller)
);
router.put(
  "/:id",
  authenticateToken,
  restrictTo(Role.Admin),
  controller.updateCategory.bind(controller)
);
router.delete(
  "/:id",
  authenticateToken,
  restrictTo(Role.Admin),
  controller.deleteCategory.bind(controller)
);

export default router;
