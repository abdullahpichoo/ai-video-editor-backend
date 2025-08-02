import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, "Project title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  resolution: z.object({
    width: z.number().int().min(1).max(7680),
    height: z.number().int().min(1).max(4320),
  }),
  fps: z.number().int().min(1).max(120).optional(),
});
