import { ITimelineTrack } from "@/models/timeline.model";

export interface UpdateTimelineRequest {
  id: string;
  duration: number;
  tracks: ITimelineTrack[];
}
