import { Worker } from "bullmq";
import { WorkerFactory } from "./processors";

export const noiseRemovalWorker = WorkerFactory.createNoiseRemovalWorker();
export const subtitleGenerationWorker = WorkerFactory.createSubtitleGenerationWorker();

export async function startWorkers(): Promise<Worker[]> {
  const workers = WorkerFactory.createAllWorkers();

  await Promise.all(workers.map((worker) => worker.waitUntilReady()));

  console.log("All AI workers started successfully");
  return workers;
}

export async function closeWorkers(): Promise<void> {
  const workers = [noiseRemovalWorker, subtitleGenerationWorker];
  await Promise.all(workers.map((worker) => worker.close()));
  console.log("All AI workers closed");
}
