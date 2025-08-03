import { upload } from "@/controllers/media-assets.controller";

import { Request, Response, NextFunction } from "express";

export const handleMulterError = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          error: {
            message: "File size exceeds the maximum allowed limit",
            code: "FILE_TOO_LARGE",
          },
        });
        return;
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({
          success: false,
          error: {
            message: "Unexpected file field. Expected field name: 'file'",
            code: "UNEXPECTED_FILE",
          },
        });
        return;
      }
      if (err.message.includes("file size") || err.message.includes("exceed")) {
        res.status(400).json({
          success: false,
          error: {
            message: err.message,
            code: "FILE_SIZE_ERROR",
          },
        });
        return;
      }
      if (err.message.includes("Unsupported file type")) {
        res.status(400).json({
          success: false,
          error: {
            message: err.message,
            code: "UNSUPPORTED_FILE_TYPE",
          },
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          message: err.message || "File upload error",
          code: "UPLOAD_ERROR",
        },
      });
      return;
    }
    next();
  });
};
