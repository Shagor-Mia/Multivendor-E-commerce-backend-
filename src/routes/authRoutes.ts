import { Router } from "express";
import { AuthController } from "../controllers/authController";
import {
  forgotPasswordLimiter,
  loginLimiter,
  resetPasswordLimiter,
} from "../middleware/rateLimmiters";

import upload from "../middleware/uploadToServer";
import { authenticateToken, restrictTo } from "../middleware/authMiddleware";

const router = Router();
const authController = new AuthController();

// Sign up (registration)
router.post(
  "/signup",
  upload.single("image"), // Image field name in form-data
  authController.signUp.bind(authController)
);

// Login
router.post("/login", loginLimiter, authController.login.bind(authController));

// New route for refreshing tokens
router.post("/refresh-token", authController.refreshToken.bind(authController));

// Logout (stateless, just a success message)
router.post("/logout", authController.logout.bind(authController));

// Forgot password (request OTP)
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword.bind(authController)
);

// Reset password (submit OTP + new password)
router.post(
  "/reset-password",
  resetPasswordLimiter,
  authController.resetPassword.bind(authController)
);

export default router;
