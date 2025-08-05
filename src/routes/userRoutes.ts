import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";
import upload from "../middleware/uploadToServer";

const router = Router();
const userController = new UserController();

router.put(
  "/:userId",
  authenticateToken,
  upload.single("image"), // For image upload
  userController.updateUser.bind(userController)
);

export default router;
