import { BaseMediaProcessor, ProgressCallback } from "./base-processor";
import { SubtitleSegment } from "@/types/ai-jobs.types";
import { extractAudioFromVideo } from "../utils/ffmpeg";

export class SubtitleGenerationProcessor extends BaseMediaProcessor {
  async process(
    sourceAsset: { storagePath: string; mimeType: string; originalName: string; duration?: number },
    progressCallback: ProgressCallback
  ): Promise<SubtitleSegment[]> {
    console.log(`📝 Starting subtitle generation for: ${sourceAsset.originalName}`);

    try {
      const localSourcePath = await this.downloadSource(sourceAsset.storagePath);

      const duration = sourceAsset.duration || 30;
      const isVideo = sourceAsset.mimeType.startsWith("video/");

      let audioPath = localSourcePath;

      if (isVideo) {
        console.log("🎬 Video detected, extracting audio...");
        audioPath = await extractAudioFromVideo(localSourcePath);
        this.tempFiles.push(audioPath);
        await progressCallback(20);
      }

      const subtitles = await this.mockSubtitleAPI(audioPath, duration, progressCallback);

      console.log(`✅ Generated ${subtitles.length} subtitle segments`);
      return subtitles;
    } catch (error) {
      console.error("❌ Subtitle generation failed:", error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async mockSubtitleAPI(
    audioPath: string,
    duration: number,
    progressCallback?: (progress: number) => Promise<void>
  ): Promise<SubtitleSegment[]> {
    console.log(`🎬 Mock subtitle API processing: ${audioPath} (${duration}s)`);

    const delay = 2000;
    const steps = [20, 40, 60, 80, 100];
    for (const progress of steps) {
      await new Promise((resolve) => setTimeout(resolve, delay)); // Use delay variable
      if (progressCallback) {
        await progressCallback(progress);
      }
      console.log(`📝 Subtitle generation progress: ${progress}%`);
    }

    // Generate random subtitles based on duration
    const subtitles = this.generateRandomSubtitles(duration);
    console.log(`✅ Generated ${subtitles.length} subtitle segments for ${duration}s duration`);

    return subtitles;
  }

  private generateRandomSubtitles(duration: number): SubtitleSegment[] {
    const sampleTexts = [
      "Welcome to our amazing video editor.",
      "Today we're exploring powerful AI features.",
      "This tool will revolutionize your workflow.",
      "Background noise removal works like magic.",
      "Clean audio makes all the difference.",
      "Automatic subtitle generation saves time.",
      "Professional results with minimal effort.",
      "Your creativity knows no bounds now.",
      "Video editing has never been easier.",
      "These features boost productivity instantly.",
      "Quality content creation made simple.",
      "Advanced AI technology at your fingertips.",
      "Transform your videos with ease.",
      "Professional editing for everyone.",
      "Seamless integration with your projects.",
      "Innovation meets user-friendly design.",
      "Create stunning content effortlessly.",
      "The future of video editing is here.",
      "Unlock your creative potential today.",
      "Thank you for choosing our platform.",
    ];

    const subtitles: SubtitleSegment[] = [];
    let currentTime = 0;

    // Generate 5-15 subtitle segments depending on duration
    const minSegments = Math.max(3, Math.floor(duration / 8));
    const maxSegments = Math.max(minSegments + 2, Math.floor(duration / 3));
    const numSegments = Math.floor(Math.random() * (maxSegments - minSegments + 1)) + minSegments;

    for (let i = 0; i < numSegments && currentTime < duration; i++) {
      // Random segment duration between 2-6 seconds
      const segmentDuration = Math.random() * 4 + 2;
      const endTime = Math.min(currentTime + segmentDuration, duration);

      // Ensure we don't exceed the total duration
      if (currentTime >= duration) break;

      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)] || "Generated subtitle text";

      subtitles.push({
        startTime: Math.round(currentTime * 10) / 10, // Round to 1 decimal place
        endTime: Math.round(endTime * 10) / 10,
        text: randomText,
      });

      // Add a small gap between subtitles (0.2-1 second)
      currentTime = endTime + Math.random() * 0.8 + 0.2;
    }

    return subtitles;
  }
}
