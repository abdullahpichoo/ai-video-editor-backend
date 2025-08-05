import { BaseMediaProcessor, ProcessingResult, ProgressCallback } from "./base-processor";
import { extractAudioFromVideo, removeAudioFromVideo, combineAudioWithVideo } from "../utils/ffmpeg";

export class NoiseRemovalProcessor extends BaseMediaProcessor {
  async process(
    sourceAsset: { storagePath: string; mimeType: string; originalName: string },
    progressCallback: ProgressCallback
  ): Promise<ProcessingResult> {
    console.log(`🔊 Starting noise removal for: ${sourceAsset.originalName}`);

    try {
      const localSourcePath = await this.downloadSource(sourceAsset.storagePath);

      const isVideo = sourceAsset.mimeType.startsWith("video/");

      if (isVideo) {
        return await this.processVideoFile(localSourcePath, sourceAsset.originalName, progressCallback);
      } else {
        return await this.processAudioFile(localSourcePath, sourceAsset.originalName, progressCallback);
      }
    } catch (error) {
      console.error("❌ Noise removal failed:", error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async processVideoFile(
    videoPath: string,
    originalName: string,
    progressCallback: ProgressCallback
  ): Promise<ProcessingResult> {
    console.log("🎬 Processing video file...");

    // Step 1: Extract audio
    await progressCallback(10);
    const audioPath = await extractAudioFromVideo(videoPath);
    this.tempFiles.push(audioPath);

    // Step 2: Create silent video
    await progressCallback(20);
    const silentVideoPath = await removeAudioFromVideo(videoPath);
    this.tempFiles.push(silentVideoPath);

    // Step 3: Clean audio
    await progressCallback(30);
    const cleanedAudioPath = await this.mockNoiseRemovalAPI(audioPath, async (progress) => {
      const mappedProgress = 30 + progress * 0.5; // Map 30-80%
      await progressCallback(mappedProgress);
    });

    // Step 4: Combine audio and video
    await progressCallback(80);
    const finalVideoPath = await combineAudioWithVideo(silentVideoPath, cleanedAudioPath);
    this.tempFiles.push(finalVideoPath);

    // Step 5: Prepare result with buffer
    await progressCallback(90);
    const filename = this.generateOutputFilename(originalName, "noise_removed", "mp4");
    const { buffer, size } = await this.readFileAsBuffer(finalVideoPath);

    await progressCallback(100);
    console.log("✅ Video noise removal completed");

    return {
      resultBuffer: buffer,
      filename,
      mimeType: "video/mp4",
      fileSize: size,
    };
  }

  private async processAudioFile(
    audioPath: string,
    originalName: string,
    progressCallback: ProgressCallback
  ): Promise<ProcessingResult> {
    console.log("🎵 Processing audio file...");

    // Clean audio directly
    await progressCallback(20);
    const cleanedAudioPath = await this.mockNoiseRemovalAPI(audioPath, async (progress) => {
      const mappedProgress = 20 + progress * 0.7; // Map 20-90%
      await progressCallback(mappedProgress);
    });

    // Prepare result with buffer
    await progressCallback(90);
    const filename = this.generateOutputFilename(originalName, "noise_removed", "mp3");
    const { buffer, size } = await this.readFileAsBuffer(cleanedAudioPath);

    await progressCallback(100);
    console.log("✅ Audio noise removal completed");

    return {
      resultBuffer: buffer,
      filename,
      mimeType: "audio/mp3",
      fileSize: size,
    };
  }

  private async mockNoiseRemovalAPI(
    audioPath: string,
    progressCallback?: (progress: number) => Promise<void>
  ): Promise<string> {
    console.log(`🔊 Mock noise removal API processing: ${audioPath}`);

    const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    for (const progress of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1200)); // 2 second delay per 10%
      if (progressCallback) {
        await progressCallback(progress);
      }
      console.log(`🔊 Noise removal progress: ${progress}%`);
    }

    // In a real implementation, this would:
    // 1. Send audio to ElevenLabs Voice Isolator API
    // 2. Get cleaned audio back
    // 3. Return the cleaned audio file path

    console.log(`✅ Mock noise removal completed for: ${audioPath}`);

    // Return the same audio path (in real implementation, this would be cleaned audio)
    return audioPath;
  }
}
