import { Collection, ObjectId } from "mongodb";
import { ITimeline, ITimelineTrack, ITimelineClip } from "@/models/Timeline";
import { getTimelinesCollection } from "@/lib/database";

export interface UpdateTimelineRequest {
  id: string;
  duration: number;
  tracks: ITimelineTrack[];
}

export class TimelineService {
  async getTimeline(projectId: string, userId: string): Promise<ITimeline | null> {
    const collection = await getTimelinesCollection();
    return await collection.findOne({ projectId, userId });
  }

  async updateTimeline(projectId: string, userId: string, timelineData: UpdateTimelineRequest): Promise<ITimeline> {
    const collection = await getTimelinesCollection();
    const existingTimeline = await collection.findOne({ projectId, userId });

    if (existingTimeline) {
      return this.updateExistingTimeline(collection, existingTimeline, timelineData);
    }

    return this.createNewTimeline(collection, projectId, userId, timelineData);
  }

  private async updateExistingTimeline(
    collection: Collection<ITimeline>,
    existingTimeline: ITimeline,
    timelineData: UpdateTimelineRequest
  ): Promise<ITimeline> {
    const processedTracks = this.processTracksWithIds(timelineData.tracks);

    const updatedTimeline: Partial<ITimeline> = {
      id: timelineData.id,
      duration: timelineData.duration,
      tracks: processedTracks,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { projectId: existingTimeline.projectId, userId: existingTimeline.userId },
      { $set: updatedTimeline }
    );

    return { ...existingTimeline, ...updatedTimeline } as ITimeline;
  }

  private async createNewTimeline(
    collection: Collection<ITimeline>,
    projectId: string,
    userId: string,
    timelineData: UpdateTimelineRequest
  ): Promise<ITimeline> {
    const processedTracks = this.processTracksWithIds(timelineData.tracks);

    const newTimeline: Omit<ITimeline, "_id"> = {
      id: timelineData.id,
      projectId,
      userId,
      duration: timelineData.duration,
      tracks: processedTracks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newTimeline as ITimeline);
    return { ...newTimeline, _id: result.insertedId } as ITimeline;
  }

  private processTracksWithIds(tracks: ITimelineTrack[]): ITimelineTrack[] {
    return tracks.map((track) => ({
      ...track,
      _id: new ObjectId(),
      clips: this.processClipsWithIds(track.clips),
    }));
  }

  private processClipsWithIds(clips: ITimelineClip[]): ITimelineClip[] {
    return clips.map((clip) => ({
      ...clip,
      _id: new ObjectId(),
    }));
  }
}
