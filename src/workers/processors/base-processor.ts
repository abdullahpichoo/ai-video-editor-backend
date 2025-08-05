import { JobService } from "@/services/job.service";
import { MediaAssetsService } from "@/services/media-assets.service";
import { cleanupTempFiles } from "../utils/ffmpeg";
import fs from "fs/promises";
import fetch from "node-fetch";
import path from "path";
import { createTempFile } from "../utils/ffmpeg";

export interface ProcessingResult {
  resultPath?: string;
  resultBuffer?: Buffer;
  filename: string;
  mimeType: string;
  fileSize?: number;
  duration?: number;
}

export interface ProgressCallback {
  (progress: number): Promise<void>;
}

export abstract class BaseMediaProcessor {
  protected tempFiles: string[] = [];

  constructor(protected jobService: JobService, protected mediaAssetsService: MediaAssetsService) {}

  protected async downloadSource(storagePath: string): Promise<string> {
    const localPath = await this.downloadFromBlob(storagePath);
    this.tempFiles.push(localPath);
    return localPath;
  }

  protected async readFileAsBuffer(filePath: string): Promise<{ buffer: Buffer; size: number }> {
    const buffer = await fs.readFile(filePath);
    return {
      buffer,
      size: buffer.length,
    };
  }

  protected generateOutputFilename(originalName: string, suffix: string, extension: string): string {
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    return `${baseName}_${suffix}_${Date.now()}.${extension}`;
  }

  protected async cleanup(): Promise<void> {
    if (this.tempFiles.length > 0) {
      await cleanupTempFiles(this.tempFiles);
      this.tempFiles = [];
    }
  }

  protected async downloadFromBlob(blobUrl: string): Promise<string> {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();

      const url = new URL(blobUrl);
      const pathname = url.pathname;
      const extension = path.extname(pathname) || ".tmp";

      const tempPath = await createTempFile(extension.slice(1)); // Remove the dot
      await fs.writeFile(tempPath, buffer);

      console.log(`✅ Download completed: ${tempPath} (${buffer.length} bytes)`);
      return tempPath;
    } catch (error) {
      console.error("❌ Blob download failed:", error);
      throw new Error(
        `Failed to download from blob storage: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  abstract process(
    sourceAsset: { storagePath: string; mimeType: string; originalName: string; duration?: number },
    progressCallback: ProgressCallback
  ): Promise<any>;
}
