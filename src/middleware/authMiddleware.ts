import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import dotenv from "dotenv";
import { verifyAccessToken } from "../utils/token";

dotenv.config();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
  cookies: { token?: string }; // Add cookies property to the interface
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // First, try to get the token from the Authorization header
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // If no token in header, try to get it from the cookie
  if (!token) {
    token = req.cookies.token;
  }

  // If still no token, the request is not authorized
  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded: any = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    // If the token is invalid or expired
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
