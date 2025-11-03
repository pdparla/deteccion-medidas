import { PoseLandmarks } from '@/types';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// MoveNet keypoint indices (17 keypoints)
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

let detectorInstance: poseDetection.PoseDetector | null = null;
let isBackendReady = false;

export async function initializePose(): Promise<poseDetection.PoseDetector> {
  if (detectorInstance) {
    return detectorInstance;
  }

  // Initialize TensorFlow.js backend
  if (!isBackendReady) {
    await tf.ready();
    await tf.setBackend('webgl');
    isBackendReady = true;
  }

  // Create MoveNet detector
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig: poseDetection.MoveNetModelConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
  };

  detectorInstance = await poseDetection.createDetector(model, detectorConfig);
  return detectorInstance;
}

export async function detectPose(imageFile: File): Promise<PoseLandmarks | null> {
  try {
    const detector = await initializePose();

    // Create image element
    const img = await createImageFromFile(imageFile);

    // Detect poses
    const poses = await detector.estimatePoses(img);

    if (poses.length === 0 || !poses[0].keypoints) {
      throw new Error('No se detectó pose en la imagen');
    }

    // Validate pose quality with very permissive thresholds
    const keypoints = poses[0].keypoints;
    const avgConfidence = keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / keypoints.length;

    if (avgConfidence < 0.15) {
      throw new Error('Calidad de imagen insuficiente. Asegúrate de que la persona esté completamente visible con buena iluminación.');
    }

    // Very permissive validation - just check that we have SOME body structure detected
    // Lower threshold to 0.1 for more flexibility across different views
    const hasShoulders = (keypoints[POSE_LANDMARKS.LEFT_SHOULDER].score || 0) > 0.1 ||
                         (keypoints[POSE_LANDMARKS.RIGHT_SHOULDER].score || 0) > 0.1;
    const hasHips = (keypoints[POSE_LANDMARKS.LEFT_HIP].score || 0) > 0.1 ||
                    (keypoints[POSE_LANDMARKS.RIGHT_HIP].score || 0) > 0.1;
    const hasLegs = (keypoints[POSE_LANDMARKS.LEFT_KNEE].score || 0) > 0.1 ||
                    (keypoints[POSE_LANDMARKS.RIGHT_KNEE].score || 0) > 0.1 ||
                    (keypoints[POSE_LANDMARKS.LEFT_ANKLE].score || 0) > 0.1 ||
                    (keypoints[POSE_LANDMARKS.RIGHT_ANKLE].score || 0) > 0.1;

    if (!hasShoulders || !hasHips || !hasLegs) {
      throw new Error('Pose incompleta detectada. Asegúrate de que la persona esté completamente visible de pies a cabeza.');
    }

    // Convert to our format (normalize keypoints to 0-1 range)
    const landmarks = keypoints.map((kp) => ({
      x: kp.x / img.width,
      y: kp.y / img.height,
      z: 0, // MoveNet doesn't provide z
      visibility: kp.score || 0,
    }));

    return {
      landmarks,
      imageWidth: img.width,
      imageHeight: img.height,
    };
  } catch (error) {
    console.error('Error detecting pose:', error);
    throw error;
  }
}

function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error cargando imagen'));
    };

    img.src = url;
  });
}

export function calculateDistance(
  landmark1: any,
  landmark2: any,
  imageWidth: number,
  imageHeight: number
): number {
  const x1 = landmark1.x * imageWidth;
  const y1 = landmark1.y * imageHeight;
  const x2 = landmark2.x * imageWidth;
  const y2 = landmark2.y * imageHeight;

  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
