import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";

const router = Router();
const userController = new UserController();

// router.post("/", userController.createUser.bind(userController));
// router.get(
//   "/",
//   authenticateToken,
//   restrictTo("Admin"),
//   userController.getUsers.bind(userController)
// );
router.delete(
  "/:userId",
  authenticateToken,
  restrictTo("Admin"),
  userController.deleteUser.bind(userController)
);
// router.put(
//   "/approve/:userId",
//   authenticateToken,
//   restrictTo("Admin"),
//   userController.approveVendor.bind(userController)
// );

router.put(
  "/:userId",
  authenticateToken,
  userController.updateUser.bind(userController)
);
// New route for admin-level user updates
router.put(
  "/admin/:userId",
  authenticateToken,
  restrictTo("Admin"),
  userController.adminUpdateUser.bind(userController)
);

export default router;
