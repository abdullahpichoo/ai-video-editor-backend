import { ITimelineTrack } from "@/models/Timeline";

export interface UpdateTimelineRequest {
  id: string;
  duration: number;
  tracks: ITimelineTrack[];
}
