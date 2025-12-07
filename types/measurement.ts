export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export interface PoseResult {
  keypoints: Keypoint[];
  imageWidth: number;
  imageHeight: number;
}

export interface SegmentationMask {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface BodyMeasurements {
  neck: number;      // cm
  shoulders: number; // cm
  chest: number;     // cm
  waist: number;     // cm
  hips: number;      // cm
  biceps: number;    // cm
  thighs: number;    // cm
  calves: number;    // cm
}

export type ViewType = 'front' | 'right' | 'back' | 'left';

export interface CapturedImage {
  view: ViewType;
  dataUrl: string;
  timestamp: number;
}

export interface ProcessedCapture extends CapturedImage {
  keypoints: Keypoint[];
  mask?: SegmentationMask; // Optional - segmentation not always available
}

export interface ValidationResult {
  isValid: boolean;
  checks: {
    fullBodyVisible: boolean;
    personCentered: boolean;
    armsSpread: boolean;
    correctOrientation: boolean;
  };
  message?: string;
}

export interface MeasurementLevel {
  from: string;
  to: string;
  ratio: number;
}

export const MEASUREMENT_LEVELS: Record<string, MeasurementLevel> = {
  neck: {
    from: 'shoulderMidpoint',
    to: 'nose',
    ratio: 0.3
  },
  chest: {
    from: 'shoulderMidpoint',
    to: 'hipMidpoint',
    ratio: 0.25
  },
  waist: {
    from: 'shoulderMidpoint',
    to: 'hipMidpoint',
    ratio: 0.6
  },
  hips: {
    from: 'hipMidpoint',
    to: 'hipMidpoint',
    ratio: 0
  },
  biceps: {
    from: 'shoulder',
    to: 'elbow',
    ratio: 0.5
  },
  thighs: {
    from: 'hip',
    to: 'knee',
    ratio: 0.2
  },
  calves: {
    from: 'knee',
    to: 'ankle',
    ratio: 0.4
  },
};
