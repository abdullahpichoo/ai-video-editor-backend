## 🎯 Job Processing Flow

### 1. Job Lifecycle

```
Create Job → Queue Job → Process Job → Store Results
     ↓           ↓           ↓            ↓
  pending → pending → processing → completed/failed
```

### 2. Progress Tracking

- Jobs update progress every 2 seconds during processing
- Frontend should poll job status every 2-3 seconds
- Estimated durations: Noise removal (120s), Subtitles (90s)

### 3. Result Handling

- **Noise Removal**: Creates new audio asset in project
- **Subtitle Generation**: Returns subtitle segments array

---

## 📋 TypeScript Interfaces

### Request Types

```typescript
interface StartAIJobRequest {
  assetId: string; // UUID of source media asset
  projectId: string; // UUID of project
}
```

### Response Types

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface JobStatusResponse {
  jobId: string;
  type: "noise-removal" | "subtitle-generation";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  estimatedDuration?: number; // seconds
  outputData?: JobOutputData;
  errorMessage?: string;
  createdAt: string; // ISO date string
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
}

interface JobOutputData {
  // For noise removal jobs
  resultAssetId?: string; // UUID of cleaned audio asset
  resultAssetPath?: string; // Storage path

  // For subtitle generation jobs
  subtitles?: SubtitleSegment[];
}

interface SubtitleSegment {
  startTime: number; // seconds
  endTime: number; // seconds
  text: string; // subtitle text
}

interface UserJobsResponse {
  jobId: string;
  type: "noise-removal" | "subtitle-generation";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  projectId: string;
  assetId: string;
  estimatedDuration?: number;
  outputData?: JobOutputData;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
```

---

## 🔊 Noise Removal API

### Start Noise Removal Job

**POST** `/api/ai/noise-removal`

**Requirements:**

- Asset must exist and belong to authenticated user
- Asset must be video/audio file with audio track
- Valid UUID format for assetId and projectId

**Request Body:**

```typescript
{
  assetId: string; // UUID
  projectId: string; // UUID
}
```

**Success Response (201):**

```typescript
{
  success: true,
  data: {
    job: JobStatusResponse
  }
}
```

**Error Responses:**

```typescript
// Asset not found (404)
{
  success: false,
  message: "Source asset not found"
}

// Invalid asset (400)
{
  success: false,
  message: "Cannot remove noise from assets without audio"
}

// Validation error (400)
{
  success: false,
  message: "Asset ID and Project ID are required"
}
```

---

## 📝 Subtitle Generation API

### Start Subtitle Generation Job

**POST** `/api/ai/subtitle-generation`

**Requirements:** Same as noise removal

**Request Body:**

```typescript
{
  assetId: string; // UUID
  projectId: string; // UUID
}
```

**Success Response (201):**

```typescript
{
  success: true,
  data: {
    job: JobStatusResponse
  }
}
```

---

## 📊 Job Status API

### Get Job Status

**GET** `/api/ai/jobs/{jobId}`

**Success Response (200):**

```typescript
{
  success: true,
  data: {
    job: JobStatusResponse
  }
}
```

**Status Examples:**

**Pending:**

```typescript
{
  jobId: "job_uuid",
  type: "noise-removal",
  status: "pending",
  progress: 0,
  estimatedDuration: 120,
  createdAt: "2025-08-04T10:30:00.000Z"
}
```

**Processing:**

```typescript
{
  jobId: "job_uuid",
  type: "noise-removal",
  status: "processing",
  progress: 45,
  estimatedDuration: 120,
  createdAt: "2025-08-04T10:30:00.000Z",
  startedAt: "2025-08-04T10:30:15.000Z"
}
```

**Completed - Noise Removal:**

```typescript
{
  jobId: "job_uuid",
  type: "noise-removal",
  status: "completed",
  progress: 100,
  outputData: {
    resultAssetId: "asset_uuid",
    resultAssetPath: "/uploads/cleaned_audio.mp3"
  },
  createdAt: "2025-08-04T10:30:00.000Z",
  startedAt: "2025-08-04T10:30:15.000Z",
  completedAt: "2025-08-04T10:32:15.000Z"
}
```

**Completed - Subtitles:**

```typescript
{
  jobId: "job_uuid",
  type: "subtitle-generation",
  status: "completed",
  progress: 100,
  outputData: {
    subtitles: [
      { startTime: 0, endTime: 3, text: "Hello and welcome!" },
      { startTime: 3, endTime: 7, text: "This is auto-generated content." },
      { startTime: 7, endTime: 10, text: "Powered by AI processing." }
    ]
  },
  createdAt: "2025-08-04T10:30:00.000Z",
  startedAt: "2025-08-04T10:30:20.000Z",
  completedAt: "2025-08-04T10:31:50.000Z"
}
```

**Failed:**

```typescript
{
  jobId: "job_uuid",
  type: "noise-removal",
  status: "failed",
  progress: 0,
  errorMessage: "AI service temporarily unavailable",
  createdAt: "2025-08-04T10:30:00.000Z",
  startedAt: "2025-08-04T10:30:15.000Z",
  completedAt: "2025-08-04T10:30:45.000Z"
}
```

**Frontend Implementation:**

```javascript
const getJobStatus = async (jobId) => {};

// Polling implementation
const pollJobStatus = (jobId, onProgress, onComplete, onError) => {
  c;
};
```

---

## 📋 List User Jobs API

### Get All User Jobs

**GET** `/api/ai/jobs`

**Optional Query Parameters:**

- `projectId` - Filter by project UUID
- `status` - Filter by job status (`pending`, `processing`, `completed`, `failed`)
- `type` - Filter by job type (`noise-removal`, `subtitle-generation`)

**Examples:**

```
GET /api/ai/jobs
GET /api/ai/jobs?projectId=project_uuid
GET /api/ai/jobs?status=completed
GET /api/ai/jobs?type=noise-removal
GET /api/ai/jobs?projectId=project_uuid&status=processing
```

**Success Response (200):**

```typescript
{
  success: true,
  data: {
    jobs: UserJobsResponse[]
  }
}
```

**Frontend Implementation:**

```javascript
const getUserJobs = async (filters = {}) => {};

// Examples
const allJobs = await getUserJobs();
const projectJobs = await getUserJobs({ projectId: "uuid" });
const completedJobs = await getUserJobs({ status: "completed" });
```

---

## 🔄 Frontend Integration Guide

### 1. Starting AI Jobs

```javascript
// Start noise removal with progress tracking
const processNoiseRemoval = async (assetId, projectId) => {};
```

### 2. Handling Subtitles

```javascript
const processSubtitles = async (assetId, projectId) => {};
```

### 3. Job Management

```javascript
// Get project's AI jobs
const getProjectJobs = async (projectId) => {
  return getUserJobs({ projectId });
};

// Check for active jobs
const hasActiveJobs = async (projectId) => {
  const jobs = await getUserJobs({
    projectId,
    status: "processing",
  });
  return jobs.length > 0;
};

// Resume monitoring existing jobs
const resumeJobMonitoring = async (projectId) => {
  const activeJobs = await getUserJobs({
    projectId,
    status: "processing",
  });

  activeJobs.forEach((job) => {
    pollJobStatus(
      job.jobId,
      (progress) => updateJobProgress(job.jobId, progress),
      (completedJob) => handleJobCompletion(completedJob),
      (error) => handleJobError(job.jobId, error)
    );
  });
};
```

---

## ⚡ Performance Guidelines

### Polling Recommendations

- **Frequency**: Poll every 2-3 seconds during processing
- **Stop Conditions**: Stop when status is `completed` or `failed`
- **Error Handling**: Retry failed requests with exponential backoff
- **UI Updates**: Update progress bars and status text on each poll

### Expected Timings

- **Noise Removal**: ~2 minutes (120 seconds)
- **Subtitle Generation**: ~1.5 minutes (90 seconds)
- **Progress Updates**: Every 2 seconds during processing

### Resource Management

- Limit concurrent job submissions (recommend max 3 jobs per user)
- Cache job results to avoid re-polling completed jobs
- Clean up polling intervals when components unmount

---

## 🚨 Error Handling

### Common Error Scenarios

1. **Asset Not Found**: User tries to process deleted/invalid asset
2. **Invalid Asset Type**: Asset doesn't have audio track
3. **Authentication**: User session expired
4. **Service Unavailable**: AI processing service is down
5. **Job Failed**: Processing encountered an error

### Error Response Format

```typescript
{
  success: false,
  message: string;  // Human-readable error message
}
```

---
