import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";

const router = Router();
const userController = new UserController();

router.post("/", userController.createUser.bind(userController));
router.get(
  "/",
  authenticateToken,
  restrictTo("Admin"),
  userController.getUsers.bind(userController)
);
router.delete(
  "/:userId",
  authenticateToken,
  restrictTo("Admin"),
  userController.deleteUser.bind(userController)
);
router.put(
  "/approve/:userId",
  authenticateToken,
  restrictTo("Admin"),
  userController.approveVendor.bind(userController)
);

export default router;
