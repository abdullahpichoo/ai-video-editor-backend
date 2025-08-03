import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/types/ApiResponse";

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", error);

  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || "APP_ERROR";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
    code = "VALIDATION_ERROR";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    code = "INVALID_ID";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
  }

  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  };

  res.status(statusCode).json(response);
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: "NOT_FOUND",
    },
  });
};
