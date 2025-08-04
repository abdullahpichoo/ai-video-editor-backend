import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt";
import { AuthenticatedRequest } from "@/types/api-response";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = req.cookies?.authToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication token is required",
          code: "MISSING_TOKEN",
        },
      });
      return;
    }

    const decoded = verifyToken(token);

    (req as AuthenticatedRequest).userId = decoded.userId;
    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: {
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      },
    });
  }
};
