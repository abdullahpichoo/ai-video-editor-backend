import { AIJob, JobType, JobStatus } from "@/models/ai-job.model";
import { getJobsCollection } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import { noiseRemovalQueue, subtitleGenerationQueue } from "@/lib/queue";

export class JobService {
  async createJob(
    type: JobType,
    userId: string,
    projectId: string,
    assetId: string,
    inputData: AIJob["inputData"]
  ): Promise<AIJob> {
    const collection = await getJobsCollection();

    const job: Omit<AIJob, "_id"> = {
      jobId: uuidv4(),
      type,
      status: "pending",
      userId,
      projectId,
      assetId,
      inputData,
      progress: 0,
      createdAt: new Date(),
      estimatedDuration: type === "noise-removal" ? 120 : 90,
    };

    const result = await collection.insertOne(job as AIJob);
    const createdJob = { ...job, _id: result.insertedId } as AIJob;

    const queue = type === "noise-removal" ? noiseRemovalQueue : subtitleGenerationQueue;
    await queue.add(
      `${type}-${job.jobId}`,
      {
        jobId: job.jobId,
        userId,
        projectId,
        assetId,
        inputData,
      },
      {
        jobId: job.jobId,
        delay: 0,
      }
    );

    return createdJob;
  }

  async getJob(jobId: string, userId: string): Promise<AIJob | null> {
    const collection = await getJobsCollection();
    return await collection.findOne({ jobId, userId });
  }

  async updateJobProgress(jobId: string, progress: number, status?: JobStatus): Promise<void> {
    const collection = await getJobsCollection();

    const updateData: Partial<AIJob> = {
      progress,
      ...(status && { status }),
      ...(status === "processing" && { startedAt: new Date() }),
      ...(status === "completed" && { completedAt: new Date() }),
    };

    await collection.updateOne({ jobId }, { $set: updateData });
  }

  async completeJob(jobId: string, outputData: AIJob["outputData"]): Promise<void> {
    const collection = await getJobsCollection();

    const updateData: any = {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
    };

    if (outputData) {
      updateData.outputData = outputData;
    }

    await collection.updateOne({ jobId }, { $set: updateData });
  }

  async failJob(jobId: string, errorMessage: string): Promise<void> {
    const collection = await getJobsCollection();

    await collection.updateOne(
      { jobId },
      {
        $set: {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        },
      }
    );
  }

  async getUserJobs(userId: string, projectId?: string, status?: string, type?: string): Promise<AIJob[]> {
    const collection = await getJobsCollection();

    const filter: any = { userId };
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    return await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  async deleteJobsByAssetId(assetId: string): Promise<void> {
    const collection = await getJobsCollection();
    await collection.deleteMany({ assetId });
  }
}
