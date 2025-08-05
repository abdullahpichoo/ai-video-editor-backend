# AI Features Integration Architecture

## 🏗️ Complete Architecture Overview

```
Frontend Request → API Endpoint → JobService.createJob() → BullMQ.add() → Worker Process → AI API → Update Job Status
```

## 📋 **Where BullMQ Fits In**

### **1. Job Creation Flow**

```
POST /api/ai/noise-removal
├── AIJobController.startNoiseRemoval()
├── JobService.createJob()
│   ├── Save job to MongoDB (status: "pending")
│   └── Add job to BullMQ queue → noiseRemovalQueue.add()
└── Return job details to frontend
```

### **2. Job Processing Flow**

```
BullMQ Worker picks up job
├── Worker updates job status to "processing"
├── Worker calls AI API (ElevenLabs/OpenAI)
│   ├── Progress updates via JobService.updateJobProgress()
│   └── Real-time progress tracking
├── Worker processes AI response
├── Worker updates job status to "completed"/"failed"
└── Frontend polls for job status
```

## 🚀 **Deployment Architecture**

### **For Render Deployment:**

1. **Main API Server** (your Express app)

   - Handles HTTP requests
   - Creates jobs in BullMQ
   - Serves job status

2. **Background Worker Process** (separate Render service)

   - Processes AI jobs from BullMQ
   - Calls ElevenLabs/OpenAI APIs
   - Updates job progress in MongoDB

3. **Redis Instance** (Render Redis add-on)
   - Stores BullMQ job queue
   - Handles job distribution
   - Manages job state

## 📁 **Project Structure**

```
src/
├── controllers/
│   └── ai-job.controller.ts       # AI job HTTP endpoints
├── services/
│   └── job.service.ts             # Job business logic + BullMQ integration
├── workers/
│   ├── index.ts                   # Worker startup script
│   └── aiWorkers.ts               # AI processing workers
├── lib/
│   └── queue.ts                   # BullMQ configuration
├── routes/
│   └── ai.ts                      # AI routes
└── models/
    └── AiJob.ts                   # Job data model
```

## 🔌 **API Endpoints**

### **Start Noise Removal**

```http
POST /api/ai/noise-removal
Content-Type: application/json

{
  "assetId": "asset_123",
  "projectId": "project_456"
}

Response:
{
  "success": true,
  "data": {
    "job": {
      "jobId": "uuid-here",
      "type": "noise-removal",
      "status": "pending",
      "progress": 0,
      "estimatedDuration": 120
    }
  }
}
```

### **Start Subtitle Generation**

```http
POST /api/ai/subtitle-generation
Content-Type: application/json

{
  "assetId": "asset_123",
  "projectId": "project_456"
}
```

### **Get Job Status**

```http
GET /api/ai/jobs/{jobId}

Response:
{
  "success": true,
  "data": {
    "job": {
      "jobId": "uuid-here",
      "type": "noise-removal",
      "status": "completed",
      "progress": 100,
      "outputData": {
        "resultAssetId": "cleaned_asset_789",
        "resultAssetPath": "path/to/cleaned.mp3"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "completedAt": "2024-01-01T00:02:00Z"
    }
  }
}
```

### **Get User Jobs**

```http
GET /api/ai/jobs?projectId=123&status=completed&type=noise-removal
```

## 🎯 **Frontend Integration**

### **1. Start AI Job**

```typescript
// Start noise removal
const response = await fetch("/api/ai/noise-removal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    assetId: "asset_123",
    projectId: "project_456",
  }),
});

const { data } = await response.json();
const jobId = data.job.jobId;
```

### **2. Poll Job Status**

```typescript
const pollJobStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/ai/jobs/${jobId}`, {
      credentials: "include",
    });

    const { data } = await response.json();
    const job = data.job;

    // Update UI with progress
    updateProgressBar(job.progress);

    if (job.status === "completed") {
      clearInterval(interval);
      handleJobComplete(job.outputData);
    } else if (job.status === "failed") {
      clearInterval(interval);
      handleJobError(job.errorMessage);
    }
  }, 2000); // Poll every 2 seconds
};
```

### **3. Real-time Progress UI**

```typescript
const JobProgress = ({ jobId }: { jobId: string }) => {
  const [job, setJob] = useState(null);

  useEffect(() => {
    const pollStatus = async () => {
      const response = await fetch(`/api/ai/jobs/${jobId}`);
      const { data } = await response.json();
      setJob(data.job);
    };

    const interval = setInterval(pollStatus, 1500);
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div>
      <progress value={job?.progress || 0} max={100} />
      <p>Status: {job?.status}</p>
      {job?.estimatedDuration && <p>ETA: {job.estimatedDuration}s</p>}
    </div>
  );
};
```

## 🔧 **Local Development Setup**

### **1. Install Redis**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

### **2. Start Development**

```bash
# Terminal 1 - Start API server
npm run dev

# Terminal 2 - Start workers
npm run dev:workers
```

### **3. Mock AI APIs Locally**

The workers include mock AI functions that simulate:

- ElevenLabs noise removal (2-minute process)
- OpenAI Whisper subtitle generation (90-second process)

## 🌐 **Production Deployment on Render**

### **1. Services Setup**

```yaml
# render.yaml
services:
  - type: web
    name: ai-video-editor-api
    env: node
    buildCommand: npm run build
    startCommand: npm run start:prod

  - type: worker
    name: ai-video-editor-workers
    env: node
    buildCommand: npm run build
    startCommand: npm run start:workers
```

### **2. Environment Variables**

```bash
# Render Environment
NODE_ENV=production
MONGODB_URI=<your-atlas-connection>
REDIS_HOST=<render-redis-host>
REDIS_PORT=<render-redis-port>
REDIS_PASSWORD=<render-redis-password>
OPENAI_API_KEY=<your-openai-key>
ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

### **3. Redis Add-on**

1. Add Redis to your Render account
2. Connect it to both web and worker services
3. Use the provided connection details

## 🎛️ **Queue Management**

### **Monitoring Jobs**

```typescript
import { noiseRemovalQueue } from "@/lib/queue";

// Get queue stats
const stats = await noiseRemovalQueue.getJobCounts();
console.log(stats); // { active: 2, waiting: 5, completed: 10, failed: 1 }

// Get active jobs
const activeJobs = await noiseRemovalQueue.getActive();

// Get failed jobs
const failedJobs = await noiseRemovalQueue.getFailed();
```

### **Queue Dashboard** (Optional)

Install Bull Dashboard for visual queue monitoring:

```bash
npm install @bull-board/express @bull-board/ui
```

## 🧪 **Testing the Integration**

### **1. Test Job Creation**

```bash
curl -X POST http://localhost:3001/api/ai/noise-removal \
  -H "Content-Type: application/json" \
  -b "authToken=your-jwt-token" \
  -d '{"assetId": "test_asset", "projectId": "test_project"}'
```

### **2. Test Job Status**

```bash
curl http://localhost:3001/api/ai/jobs/your-job-id \
  -b "authToken=your-jwt-token"
```

## 🔄 **Job Lifecycle States**

1. **pending** - Job created, waiting in queue
2. **processing** - Worker picked up job, calling AI API
3. **completed** - AI processing successful, results available
4. **failed** - Error occurred during processing

## 🚨 **Error Handling**

Jobs automatically retry 3 times with exponential backoff:

- Retry 1: 2 seconds delay
- Retry 2: 4 seconds delay
- Retry 3: 8 seconds delay
- After 3 failures: Job marked as "failed"

## 📊 **Performance Considerations**

- **Concurrency**: 2 jobs per worker (configurable)
- **Memory**: Each job processes ~100MB video files
- **Storage**: Results stored in Vercel Blob/MongoDB
- **Monitoring**: Built-in job progress tracking
- **Scaling**: Add more worker processes on Render

This architecture provides a robust, scalable foundation for AI-powered video editing features with proper job queuing, progress tracking, and production deployment support.
