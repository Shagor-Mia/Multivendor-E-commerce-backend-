import express from "express";
import { CategoryController } from "../controllers/categoryController";

const router = express.Router();
const controller = new CategoryController();

router.post("/", controller.createCategory.bind(controller));
router.get("/", controller.getCategories.bind(controller));
router.get("/:id", controller.getCategoryById.bind(controller));
router.put("/:id", controller.updateCategory.bind(controller));
router.delete("/:id", controller.deleteCategory.bind(controller));

export default router;
