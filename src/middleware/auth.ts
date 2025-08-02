import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt";
import { AuthenticatedRequest } from "@/server/types/ApiResponse";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authorization header is required",
          code: "MISSING_AUTH_HEADER",
        },
      });
      return;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: "Token is required",
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
