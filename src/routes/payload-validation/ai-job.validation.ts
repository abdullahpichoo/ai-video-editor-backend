import { z } from "zod";

export const startAIJobSchema = z.object({
  assetId: z.string(),
  projectId: z.string(),
});
