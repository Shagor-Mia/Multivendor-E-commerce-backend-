import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";
const router = Router();
const adminController = new AdminController();
// Approve vendor (Admin only)
router.put(
  "/approve/:userId",
  authenticateToken,
  restrictTo("Admin"),
  adminController.approveVendor.bind(adminController)
);

// NEW: Get all approved vendors (Admin only)
router.get(
  "/vendors/approved",
  authenticateToken,
  restrictTo("Admin"),
  adminController.getApprovedVendors.bind(adminController)
);
// Get all users (admin only)
router.get(
  "/users",
  authenticateToken,
  restrictTo("Admin"),
  adminController.getAllUsers.bind(adminController)
);
// Get single users (admin only)
router.get(
  "/users/:userId",
  authenticateToken,
  restrictTo("Admin"),
  adminController.getSingleUserById.bind(adminController)
);

// NEW: Get all unapproved vendors (Admin only)
router.get(
  "/vendors/unapproved",
  authenticateToken,
  restrictTo("Admin"),
  adminController.getUnapprovedVendors.bind(adminController)
);
// New route for admin-level user updates for vendors
router.put(
  "/admin/:userId",
  authenticateToken,
  restrictTo("Admin"),
  adminController.adminUpdateUser.bind(adminController)
);

router.delete(
  "/:userId",
  authenticateToken,
  restrictTo("Admin"),
  adminController.deleteUser.bind(adminController)
);

export default router;
