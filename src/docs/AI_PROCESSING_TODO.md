# AI Processing Implementation TODO

## 🎯 Overview

Implementation plan for noise removal and subtitle generation endpoints with proper video/audio handling using ffmpeg and Vercel blob storage.

---

## 📝 Subtitle Generation Endpoint

### ✅ Current Status

- [x] Basic mock subtitle generation with random timing
- [x] Worker infrastructure setup
- [x] Progress tracking

### 🔄 Video Asset Processing

- [x] **Install ffmpeg dependencies**

  - [x] Add `fluent-ffmpeg` package
  - [x] Add `@types/fluent-ffmpeg` for TypeScript
  - [x] Ensure ffmpeg binary is available in deployment environment

- [x] **Video audio extraction**

  - [x] Create `extractAudioFromVideo()` utility function
  - [x] Use ffmpeg to extract audio track from video file
  - [x] Save extracted audio as temporary file (WAV/MP3 format)
  - [x] Handle extraction errors gracefully

- [x] **Audio upload to Vercel Blob**

  - [x] Create `uploadAudioToBlob()` utility function
  - [x] Upload extracted audio to Vercel blob storage
  - [x] Generate accessible blob URL for processing
  - [x] Clean up temporary local audio file

- [x] **Subtitle generation from audio**
  - [x] Pass blob audio URL to subtitle generation mock API
  - [x] Generate random subtitles based on audio duration
  - [x] Return subtitle segments with proper timing

### 🎵 Audio Asset Processing

- [x] **Direct audio processing**
  - [x] Detect if asset is already audio format
  - [x] Skip extraction step for audio files
  - [x] Process audio directly for subtitle generation

### 🔧 Error Handling

- [ ] **Validation**

  - [ ] Verify asset has audio track (for videos)
  - [ ] Handle unsupported video/audio formats
  - [ ] Validate file size limits

- [ ] **Cleanup**
  - [ ] Remove temporary files on success/failure
  - [ ] Handle blob upload failures
  - [ ] Cleanup incomplete processing attempts

---

## 🔊 Noise Removal Endpoint

### ✅ Current Status

- [x] Basic mock noise removal functionality
- [x] Worker infrastructure setup
- [x] Progress tracking

### 🎬 Video Asset Processing

- [x] **Video audio extraction**

  - [x] Create `extractAudioFromVideo()` utility (shared with subtitles)
  - [x] Extract audio track from video file
  - [x] Create audio-less video file (video track only)
  - [x] Store both files temporarily

- [x] **Audio noise removal**

  - [x] Pass extracted audio to noise removal mock API
  - [x] Generate "cleaned" audio (use same audio for mock)
  - [x] Save cleaned audio as temporary file

- [x] **Video reconstruction**

  - [x] Create `combineAudioWithVideo()` utility function
  - [x] Use ffmpeg to merge cleaned audio with video track
  - [x] Ensure audio/video sync is maintained
  - [x] Generate final processed video file

- [x] **Upload final video**
  - [x] Upload processed video to Vercel blob storage
  - [x] Create new MediaAsset record with processed video
  - [x] Return new asset ID and storage path

### 🎵 Audio Asset Processing

- [x] **Direct audio processing**

  - [x] Detect if asset is audio format
  - [x] Process audio directly through noise removal mock
  - [x] Generate "cleaned" audio file

- [x] **Upload processed audio**
  - [x] Upload cleaned audio to Vercel blob storage
  - [x] Create new MediaAsset record for cleaned audio
  - [x] Return new asset ID and storage path

### 🔧 Utility Functions Needed

#### File Processing

- [x] **`extractAudioFromVideo(videoPath: string): Promise<string>`**

  - [x] Extract audio track using ffmpeg
  - [x] Return path to extracted audio file
  - [x] Handle videos without audio tracks

- [x] **`removeAudioFromVideo(videoPath: string): Promise<string>`**

  - [x] Create video file without audio track
  - [x] Return path to silent video file

- [x] **`combineAudioWithVideo(videoPath: string, audioPath: string): Promise<string>`**
  - [x] Merge audio and video tracks
  - [x] Maintain synchronization
  - [x] Return path to combined file

#### Storage Management

- [x] **`uploadToVercelBlob(filePath: string, mimeType: string): Promise<string>`**

  - [x] Upload file to Vercel blob storage
  - [x] Return accessible blob URL
  - [x] Handle upload errors

- [x] **`downloadFromBlob(blobUrl: string): Promise<string>`**

  - [x] Download file from blob storage to temporary location
  - [x] Return local file path for processing
  - [x] Handle download errors

- [x] **`cleanupTempFiles(filePaths: string[]): Promise<void>`**
  - [x] Remove temporary files after processing
  - [x] Handle cleanup errors gracefully

#### Mock AI Processing

- [x] **`mockNoiseRemovalAPI(audioPath: string): Promise<string>`**

  - [x] Simulate noise removal processing
  - [x] Return path to "cleaned" audio (same file for mock)
  - [x] Add realistic processing delay

- [x] **`mockSubtitleAPI(audioPath: string, duration: number): Promise<SubtitleSegment[]>`**
  - [x] Generate random subtitles for audio duration
  - [x] Use existing `generateRandomSubtitles()` function
  - [x] Add realistic processing delay

---

## 🔄 Worker Updates

### Noise Removal Worker

- [x] **Update worker logic**
  - [x] Detect video vs audio asset type
  - [x] Route to appropriate processing pipeline
  - [x] Handle progress updates throughout pipeline
  - [x] Update job status with intermediate steps

### Subtitle Generation Worker

- [x] **Update worker logic**
  - [x] Detect video vs audio asset type
  - [x] Extract audio if needed
  - [x] Process through subtitle generation
  - [x] Return subtitle segments

---

## 📦 Dependencies & Setup

### Package Installations

- [x] **Install ffmpeg packages**

  ```bash
  npm install fluent-ffmpeg
  npm install -D @types/fluent-ffmpeg
  ```

- [x] **Verify Vercel blob setup**
  - [x] Ensure `@vercel/blob` is configured
  - [ ] Test blob upload/download functionality
  - [ ] Set up proper environment variables

### Environment Setup

- [x] **Local development**

  - [x] Install ffmpeg binary locally
  - [ ] Test ffmpeg functionality
  - [x] Set up temp directory for processing

- [ ] **Production deployment**
  - [ ] Ensure ffmpeg is available in production environment
  - [ ] Configure temp storage for processing
  - [ ] Set up proper cleanup mechanisms

---

## 🧪 Testing Plan

### Unit Tests

- [ ] **Test ffmpeg utilities**

  - [ ] Audio extraction from video
  - [ ] Video/audio combination
  - [ ] Error handling for corrupt files

- [ ] **Test blob storage utilities**
  - [ ] Upload/download functionality
  - [ ] Error handling for network issues
  - [ ] Cleanup mechanisms

### Integration Tests

- [ ] **End-to-end noise removal**

  - [ ] Test with video files
  - [ ] Test with audio files
  - [ ] Verify output quality and format

- [ ] **End-to-end subtitle generation**
  - [ ] Test with video files
  - [ ] Test with audio files
  - [ ] Verify subtitle timing accuracy

### Performance Tests

- [ ] **Processing time benchmarks**
  - [ ] Measure processing time for different file sizes
  - [ ] Test concurrent job processing
  - [ ] Memory usage monitoring

---

## 🚀 Implementation Priority

### Phase 1: Core Utilities (Week 1)

1. [x] Install and configure ffmpeg
2. [x] Implement audio extraction utility
3. [x] Implement blob upload/download utilities
4. [x] Create temp file cleanup system

### Phase 2: Subtitle Generation (Week 2)

1. [x] Update subtitle generation for video assets
2. [ ] Test audio extraction pipeline
3. [x] Integrate with existing worker
4. [x] Add comprehensive error handling

### Phase 3: Noise Removal (Week 3)

1. [x] Implement video audio removal
2. [x] Implement audio/video combination
3. [x] Update noise removal worker
4. [ ] Test full video processing pipeline

### Phase 4: Testing & Optimization (Week 4)

1. [ ] Comprehensive testing suite
2. [ ] Performance optimization
3. [ ] Error handling refinement
4. [ ] Documentation updates

---

## ⚠️ Considerations & Challenges

### Technical Challenges

- [ ] **ffmpeg complexity**

  - Video format compatibility
  - Audio/video sync issues
  - Processing time for large files

- [ ] **Storage management**

  - Temporary file cleanup
  - Blob storage limits
  - Network reliability

- [ ] **Error recovery**
  - Partial processing failures
  - Resource cleanup on errors
  - User notification of failures

### Performance Considerations

- [ ] **Resource usage**

  - CPU intensive ffmpeg operations
  - Memory usage for large files
  - Concurrent processing limits

- [ ] **Storage costs**
  - Temporary blob storage usage
  - Cleanup of processed files
  - Storage optimization strategies

---

## 📚 Resources & Documentation

### FFmpeg Documentation

- [ ] Audio extraction commands
- [ ] Video manipulation commands
- [ ] Error handling patterns

### Vercel Blob Documentation

- [ ] Upload/download APIs
- [ ] Storage limits and pricing
- [ ] Best practices

This comprehensive plan will transform the mock AI processing into a realistic video/audio processing pipeline! 🎬🎵
