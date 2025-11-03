export interface UserData {
  height: number; // cm
}

export interface Photos {
  front: File | null;
  back: File | null;
  left: File | null;
  right: File | null;
}

export interface PoseLandmarks {
  landmarks: any; // MediaPipe NormalizedLandmarkList
  imageWidth: number;
  imageHeight: number;
}

export interface BodyMeasurements {
  neck: number;
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  thigh: number;
  calf: number;
  bicep: number;
}

export type PhotoType = 'front' | 'back' | 'left' | 'right';

export interface PhotoSlotProps {
  type: PhotoType;
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
}
