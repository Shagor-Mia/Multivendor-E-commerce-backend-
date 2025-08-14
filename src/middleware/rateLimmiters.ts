import rateLimit from "express-rate-limit";

// Limit: 5 attempts per  30 seconds for login
export const loginLimiter = rateLimit({
  windowMs: 0.5 * 60 * 1000, //  30 seconds
  message: "Too many login attempts. Please try again after 30 seconds.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit: 3 OTP requests per  30 seconds
export const forgotPasswordLimiter = rateLimit({
  windowMs: 0.5 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Please try again after 30 seconds.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit: 5 password reset attempts per  30 seconds
export const resetPasswordLimiter = rateLimit({
  windowMs: 0.5 * 60 * 1000,
  max: 5,
  message:
    "Too many password reset attempts. Please try again after  30 seconds.",
  standardHeaders: true,
  legacyHeaders: false,
});
