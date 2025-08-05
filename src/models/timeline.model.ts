import { ObjectId } from "mongodb";

export interface ISubtitleStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  position: "top" | "center" | "bottom";
  alignment: "left" | "center" | "right";
  outline: boolean;
  shadow: boolean;
}

export interface ITimelineClip {
  _id?: ObjectId;
  id: string;
  trackId: string;
  assetId?: string;

  type: "video" | "audio" | "image" | "text";

  startTime: number;
  duration: number;

  originalStartTime: number;
  originalEndTime: number;

  trimStart: number;
  trimEnd: number;

  assetPath?: string;
  assetName?: string;
  assetDimensions?: {
    width: number;
    height: number;
  };

  transform?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };

  volume: number;

  text?: string;
  style?: ISubtitleStyle;

  name: string;
  color?: string;
  locked: boolean;
  selected: boolean;
}

export interface ITimelineTrack {
  _id?: ObjectId;
  id: string;
  name: string;
  type: "video" | "audio" | "image" | "text";
  clips: ITimelineClip[];
  layerIndex: number;
  isVisible: boolean;
  isMuted: boolean;
  volume: number;
  locked: boolean;
}

export interface ITimeline {
  _id?: ObjectId;
  id: string;
  projectId: string;
  userId: string;
  duration: number;
  tracks: ITimelineTrack[];
  createdAt: Date;
  updatedAt: Date;
}
