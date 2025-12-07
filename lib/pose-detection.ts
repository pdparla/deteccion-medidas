'use client';

import { loadModel, Tensor } from './litert';
import { Keypoint, PoseResult } from '@/types/measurement';
import { KEYPOINTS } from '@/types/pose';
import { loadImageFromDataURL, getImageData } from './utils';

let poseModel: Awaited<ReturnType<typeof loadModel>> | null = null;

export async function initPoseDetection() {
  if (poseModel) return poseModel;

  // Use pure float32 model converted from SavedModel
  // This model has ALL tensors as float32/int32 (LiteRT.js compatible)
  console.log('Loading pure float32 MoveNet Lightning model...');

  poseModel = await loadModel('/models/movenet_lightning_pure_f32.tflite', {
    accelerator: 'wasm', // Start with WASM for stability
  });

  console.log('Model loaded successfully!');
  return poseModel;
}

export async function detectPose(imageDataUrl: string): Promise<PoseResult> {
  const model = await initPoseDetection();

  // Load and prepare image
  const img = await loadImageFromDataURL(imageDataUrl);

  // MoveNet Lightning expects 192x192 input, resize to exact dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const inputSize = 192;
  canvas.width = inputSize;
  canvas.height = inputSize;
  ctx.drawImage(img, 0, 0, inputSize, inputSize);

  // Get image data and convert to RGB tensor
  const imageData = getImageData(canvas);
  const inputTensor = await preprocessImage(imageData);

  try {
    console.log('Input tensor info:', {
      accelerator: inputTensor.accelerator,
      type: inputTensor.type
    });

    // Run inference
    console.log('Running model inference...');
    const outputs = model.run(inputTensor);
    console.log('Inference complete, outputs:', outputs.length);

    // Get output tensor - on WASM backend, directly read the data
    const outputTensor = outputs[0];
    console.log('Output tensor info:', {
      accelerator: outputTensor.accelerator,
      type: outputTensor.type
    });

    const result = outputTensor.toTypedArray() as Float32Array;
    console.log('Result array length:', result.length);

    // Cleanup output tensor
    outputTensor.delete();

    // Parse keypoints from MoveNet output
    // MoveNet Lightning outputs shape [1, 1, 17, 3] where each keypoint has [y, x, score]
    // Keypoints are normalized [0, 1], scale to original image dimensions
    const keypoints: Keypoint[] = [];
    for (let i = 0; i < 17; i++) {
      const yIndex = i * 3;
      const xIndex = i * 3 + 1;
      const scoreIndex = i * 3 + 2;

      keypoints.push({
        y: result[yIndex] * img.height,
        x: result[xIndex] * img.width,
        score: result[scoreIndex],
      });
    }

    // Cleanup
    inputTensor.delete();

    return {
      keypoints,
      imageWidth: img.width,
      imageHeight: img.height,
    };
  } catch (error) {
    inputTensor.delete();
    throw error;
  }
}

async function preprocessImage(imageData: ImageData): Promise<any> {
  const { width, height, data } = imageData;
  const inputSize = 192; // MoveNet Lightning uses 192x192

  // MoveNet expects int32 input with RGB values [0, 255]
  // NOT normalized float32 [0, 1]
  const rgbData = new Int32Array(inputSize * inputSize * 3);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const pixelIndex = (i * width + j) * 4;
      const tensorIndex = (i * width + j) * 3;

      // Keep values as integers 0-255 (int32)
      rgbData[tensorIndex] = data[pixelIndex];       // R
      rgbData[tensorIndex + 1] = data[pixelIndex + 1]; // G
      rgbData[tensorIndex + 2] = data[pixelIndex + 2]; // B
    }
  }

  // Create tensor with shape [1, 192, 192, 3] as int32
  // Use fromTypedArray static method for proper backend allocation
  return Tensor.fromTypedArray(rgbData, [1, inputSize, inputSize, 3]);
}

export function validatePose(keypoints: Keypoint[]): {
  isValid: boolean;
  message?: string;
} {
  // Check minimum confidence
  const avgScore = keypoints.reduce((sum, kp) => sum + kp.score, 0) / keypoints.length;
  if (avgScore < 0.3) {
    return {
      isValid: false,
      message: 'Pose detection confidence too low. Please ensure good lighting and full body visibility.',
    };
  }

  // Check critical keypoints are visible
  const criticalKeypoints = [
    KEYPOINTS.NOSE,
    KEYPOINTS.LEFT_SHOULDER,
    KEYPOINTS.RIGHT_SHOULDER,
    KEYPOINTS.LEFT_HIP,
    KEYPOINTS.RIGHT_HIP,
    KEYPOINTS.LEFT_KNEE,
    KEYPOINTS.RIGHT_KNEE,
    KEYPOINTS.LEFT_ANKLE,
    KEYPOINTS.RIGHT_ANKLE,
  ];

  const missingKeypoints = criticalKeypoints.filter(
    (idx) => keypoints[idx].score < 0.2
  );

  if (missingKeypoints.length > 3) {
    return {
      isValid: false,
      message: 'Cannot detect full body. Please ensure your entire body is visible in the frame.',
    };
  }

  return { isValid: true };
}

export function getKeypointMidpoint(
  kp1: Keypoint,
  kp2: Keypoint
): { x: number; y: number } {
  return {
    x: (kp1.x + kp2.x) / 2,
    y: (kp1.y + kp2.y) / 2,
  };
}

export function calculateDistance(kp1: Keypoint, kp2: Keypoint): number {
  const dx = kp2.x - kp1.x;
  const dy = kp2.y - kp1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
