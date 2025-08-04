import { z } from "zod";

const subtitleStyleSchema = z.object({
  fontSize: z.number().min(8).max(72),
  fontFamily: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  position: z.enum(["top", "center", "bottom"]),
  alignment: z.enum(["left", "center", "right"]),
  outline: z.boolean(),
  shadow: z.boolean(),
});

const timelineClipSchema = z.object({
  id: z.string().min(1),
  trackId: z.string().min(1),
  assetId: z.string().optional(),
  type: z.enum(["video", "audio", "image", "text"]),
  startTime: z.number().min(0),
  duration: z.number().min(0.01),
  originalStartTime: z.number().min(0),
  originalEndTime: z.number().min(0),
  trimStart: z.number().min(0),
  trimEnd: z.number().min(0),
  assetPath: z.string().optional(),
  assetName: z.string().optional(),
  assetDimensions: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  transform: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number().min(1),
      height: z.number().min(1),
      rotation: z.number(),
      scaleX: z.number().min(0),
      scaleY: z.number().min(0),
    })
    .optional(),
  volume: z.number().min(0).max(1),
  text: z.string().optional(),
  style: subtitleStyleSchema.optional(),
  name: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  locked: z.boolean(),
  selected: z.boolean(),
});

const timelineTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["video", "audio", "image", "text"]),
  clips: z.array(timelineClipSchema),
  layerIndex: z.number().int().min(0),
  isVisible: z.boolean(),
  isMuted: z.boolean(),
  volume: z.number().min(0).max(1),
  locked: z.boolean(),
});

export const updateTimelineSchema = z.object({
  id: z.string().min(1),
  duration: z.number().min(0.01),
  tracks: z.array(timelineTrackSchema),
});
