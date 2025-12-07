'use client';

import { loadModel, Tensor } from './litert';
import { loadImageFromDataURL, getImageData } from './utils';

// DeepLabV3 configuration
// Output: [1, 21, 256, 256] - 21 classes including background
// Person class is index 15 in COCO/PASCAL VOC
const MODEL_PATH = '/models/deeplabv3_resnet50_256.tflite';
const INPUT_SIZE = 256;
const PERSON_CLASS = 15;

// ImageNet normalization constants
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

let segmentationModel: Awaited<ReturnType<typeof loadModel>> | null = null;

export async function initSegmentation() {
  if (segmentationModel) return segmentationModel;

  console.log('Loading DeepLabV3 model...');
  try {
    segmentationModel = await loadModel(MODEL_PATH, {
      accelerator: 'webgpu', // Use WebGPU for better performance
    });
    console.log('DeepLabV3 model loaded!');
    return segmentationModel;
  } catch (error) {
    console.error('Failed to load DeepLabV3 model:', error);
    // Fallback to WASM if WebGPU fails
    console.log('Falling back to WASM...');
    segmentationModel = await loadModel(MODEL_PATH, {
      accelerator: 'wasm',
    });
    return segmentationModel;
  }
}

export async function segmentPerson(imageDataUrl: string): Promise<Uint8Array> {
  const model = await initSegmentation();

  // Load image
  const img = await loadImageFromDataURL(imageDataUrl);

  // Resize to model input size (256x256)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);

  // Preprocess with ImageNet normalization
  const inputTensor = await preprocessImage(getImageData(canvas));

  try {
    // Inference
    console.log('Running DeepLabV3 segmentation...');
    const outputs = model.run(inputTensor);

    // Output shape: [1, 21, 256, 256]
    // Each pixel has 21 class scores
    const outputTensor = outputs[0];
    const data = outputTensor.toTypedArray() as Float32Array;

    // Create binary mask for person class
    const mask = new Uint8Array(INPUT_SIZE * INPUT_SIZE);
    const numClasses = 21;

    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
      let maxScore = -Infinity;
      let maxClass = 0;

      // Find class with highest score for this pixel
      for (let c = 0; c < numClasses; c++) {
        const score = data[i * numClasses + c];
        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }

      // Mark as person (class 15)
      if (maxClass === PERSON_CLASS) {
        mask[i] = 255;
      } else {
        mask[i] = 0;
      }
    }

    // Clean up tensors
    inputTensor.delete();
    outputTensor.delete();

    return mask;

  } catch (error) {
    inputTensor.delete();
    throw error;
  }
}

async function preprocessImage(imageData: ImageData): Promise<any> {
  const { width, height, data } = imageData;

  // Create float32 buffer [1, 3, 256, 256] with ImageNet normalization
  const floatData = new Float32Array(3 * width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4] / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    // Apply ImageNet normalization: (pixel - mean) / std
    floatData[i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    floatData[width * height + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    floatData[2 * width * height + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  // Shape: [1, 3, height, width] (NCHW format for PyTorch models)
  return Tensor.fromTypedArray(floatData, [1, 3, height, width]);
}
