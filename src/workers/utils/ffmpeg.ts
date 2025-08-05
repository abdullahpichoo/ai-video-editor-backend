import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import os from "os";

class FFmpegManager {
  private static instance: FFmpegManager;
  private initialized = false;

  private constructor() {}

  static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg.getAvailableFormats((err, formats) => {
          if (err) {
            console.error("FFmpeg not available:", err);
            reject(new Error("FFmpeg binary not found. Please install ffmpeg."));
          } else {
            console.log("✅ FFmpeg initialized successfully");
            resolve();
          }
        });
      });

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize FFmpeg:", error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  createCommand(input?: string): ffmpeg.FfmpegCommand {
    if (!this.initialized) {
      throw new Error("FFmpeg not initialized. Call initialize() first.");
    }
    return ffmpeg(input);
  }
}

export const ffmpegManager = FFmpegManager.getInstance();

export async function createTempFile(extension: string): Promise<string> {
  const tempDir = os.tmpdir();
  const filename = `ai_video_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
  return path.join(tempDir, filename);
}

export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  await ffmpegManager.initialize();

  const outputPath = await createTempFile("wav");

  return new Promise((resolve, reject) => {
    ffmpegManager
      .createCommand(videoPath)
      .audioCodec("pcm_s16le") // Uncompressed WAV for better processing
      .audioFrequency(44100)
      .audioChannels(2)
      .noVideo()
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("Extracting audio:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Audio extraction progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on("end", () => {
        console.log("Audio extraction completed:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("Audio extraction failed:", err);
        reject(new Error(`Failed to extract audio: ${err.message}`));
      })
      .run();
  });
}

export async function removeAudioFromVideo(videoPath: string): Promise<string> {
  await ffmpegManager.initialize();

  const outputPath = await createTempFile("mp4");

  return new Promise((resolve, reject) => {
    ffmpegManager
      .createCommand(videoPath)
      .videoCodec("copy") // Copy video stream without re-encoding
      .noAudio()
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("🎬 Removing audio from video:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`🎬 Audio removal progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on("end", () => {
        console.log("✅ Audio removal completed:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Audio removal failed:", err);
        reject(new Error(`Failed to remove audio: ${err.message}`));
      })
      .run();
  });
}

export async function combineAudioWithVideo(videoPath: string, audioPath: string): Promise<string> {
  await ffmpegManager.initialize();

  const outputPath = await createTempFile("mp4");

  return new Promise((resolve, reject) => {
    ffmpegManager
      .createCommand(videoPath)
      .input(audioPath)
      .videoCodec("copy") // Copy video stream without re-encoding
      .audioCodec("aac") // Re-encode audio to AAC for compatibility
      .audioBitrate("192k")
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("🔗 Combining audio with video:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`🔗 Audio/video combination progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on("end", () => {
        console.log("✅ Audio/video combination completed:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Audio/video combination failed:", err);
        reject(new Error(`Failed to combine audio with video: ${err.message}`));
      })
      .run();
  });
}

export async function getMediaInfo(filePath: string): Promise<{
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
  format: string;
}> {
  await ffmpegManager.initialize();

  return new Promise((resolve, reject) => {
    ffmpegManager.createCommand(filePath).ffprobe((err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get media info: ${err.message}`));
        return;
      }

      const duration = metadata.format.duration || 0;
      const hasAudio = metadata.streams.some((stream) => stream.codec_type === "audio");
      const hasVideo = metadata.streams.some((stream) => stream.codec_type === "video");
      const format = metadata.format.format_name || "unknown";

      console.log(`📊 Media info - Duration: ${duration}s, Audio: ${hasAudio}, Video: ${hasVideo}, Format: ${format}`);

      resolve({
        duration,
        hasAudio,
        hasVideo,
        format,
      });
    });
  });
}

export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  const cleanupPromises = filePaths.map(async (filePath) => {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Cleaned up temp file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup temp file: ${filePath}`, error);
    }
  });

  await Promise.allSettled(cleanupPromises);
}
