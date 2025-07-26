import rateLimit from "express-rate-limit";

// Limit: 5 attempts per 15 minutes for login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit: 3 OTP requests per 15 minutes
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit: 5 password reset attempts per 15 minutes
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Too many password reset attempts. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});
