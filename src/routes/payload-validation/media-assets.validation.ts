import { upload } from "@/controllers/media-assets.controller";
import { NextFunction } from "express";
import { z } from "zod";

const supportedMimeTypes = [
  "video/mp4",
  "video/webm",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/mp3",
] as const;

const FILE_SIZE_LIMITS = {
  video: 100 * 1024 * 1024, // 100MB for videos
  image: 5 * 1024 * 1024, // 5MB for images
  audio: 10 * 1024 * 1024, // 10MB for audio
} as const;

const getMaxFileSize = (mimeType: string): number => {
  if (mimeType.startsWith("video/")) return FILE_SIZE_LIMITS.video;
  if (mimeType.startsWith("image/")) return FILE_SIZE_LIMITS.image;
  if (mimeType.startsWith("audio/")) return FILE_SIZE_LIMITS.audio;
  return FILE_SIZE_LIMITS.image;
};

export const uploadMediaSchema = z
  .object({
    originalName: z.string().min(1, "Original filename is required"),
    mimeType: z
      .enum(supportedMimeTypes)
      .refine((val) => supportedMimeTypes.includes(val), {
        message: "Unsupported file type",
      }),
    fileSize: z.number().int().min(1, "File size must be greater than 0"),

    duration: z.number().min(0).optional(),
    dimensions: z
      .object({
        width: z.number().int().min(1),
        height: z.number().int().min(1),
      })
      .optional(),
    fps: z.number().min(1).max(120).optional(),
    hasAudio: z.boolean().optional(),

    thumbnailDataUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      const maxSize = getMaxFileSize(data.mimeType);
      return data.fileSize <= maxSize;
    },
    {
      message: "File size exceeds the maximum limit for this file type",
      path: ["fileSize"],
    }
  )
  .refine(
    (data) => {
      console.log("zod data duration", data);
      // Video files must have duration and dimensions
      if (data.mimeType.startsWith("video/")) {
        return data.duration !== undefined && data.dimensions !== undefined;
      }
      return true;
    },
    {
      message: "Video files must include duration and dimensions metadata",
      path: ["duration"],
    }
  )
  .refine(
    (data) => {
      // Image files must have dimensions
      if (data.mimeType.startsWith("image/")) {
        return data.dimensions !== undefined;
      }
      return true;
    },
    {
      message: "Image files must include dimensions metadata",
      path: ["dimensions"],
    }
  )
  .refine(
    (data) => {
      // Audio files must have duration
      if (data.mimeType.startsWith("audio/")) {
        return data.duration !== undefined;
      }
      return true;
    },
    {
      message: "Audio files must include duration metadata",
      path: ["duration"],
    }
  );

export { FILE_SIZE_LIMITS, getMaxFileSize };
