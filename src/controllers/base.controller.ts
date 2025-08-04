import { Response } from "express";
import { HttpStatusCode } from "@/constants/HttpStatusCode";
import { ApiResponse, AuthenticatedRequest } from "@/types/api-response";

export abstract class BaseController {
  protected getUserId(request: AuthenticatedRequest): string {
    return request.userId;
  }

  protected success<T>(res: Response, data: T, statusCode: HttpStatusCode = HttpStatusCode.OK): void {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  protected created<T>(res: Response, data: T): void {
    this.success(res, data, HttpStatusCode.CREATED);
  }

  protected noContent(res: Response): void {
    res.status(HttpStatusCode.NO_CONTENT).json({
      success: true,
      data: null,
    });
  }

  protected error(
    res: Response,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code?: string,
    details?: unknown
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        details,
      },
    });
  }

  protected badRequest(res: Response, message: string, details?: unknown): void {
    this.error(res, message, HttpStatusCode.BAD_REQUEST, "BAD_REQUEST", details);
  }

  protected unauthorized(res: Response, message: string = "Unauthorized"): void {
    this.error(res, message, HttpStatusCode.UNAUTHORIZED, "UNAUTHORIZED");
  }

  protected forbidden(res: Response, message: string = "Forbidden"): void {
    this.error(res, message, HttpStatusCode.FORBIDDEN, "FORBIDDEN");
  }

  protected notFound(res: Response, message: string = "Resource not found"): void {
    this.error(res, message, HttpStatusCode.NOT_FOUND, "NOT_FOUND");
  }

  protected conflict(res: Response, message: string, details?: unknown): void {
    this.error(res, message, HttpStatusCode.CONFLICT, "CONFLICT", details);
  }

  protected validationError(res: Response, message: string, details?: unknown): void {
    this.error(res, message, HttpStatusCode.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", details);
  }
}
