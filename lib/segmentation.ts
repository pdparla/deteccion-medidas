'use client';

import { loadModel, Tensor, detectBackend } from './litert';
import { SegmentationMask } from '@/types/measurement';
import { loadImageFromDataURL, resizeImage, getImageData } from './utils';

let segmentationModel: Awaited<ReturnType<typeof loadModel>> | null = null;
let currentBackend: 'webgpu' | 'wasm' = 'wasm';

export async function initSegmentation() {
  if (segmentationModel) return segmentationModel;

  currentBackend = await detectBackend();
  segmentationModel = await loadModel('/models/selfie_segmenter.tflite', {
    accelerator: currentBackend,
  });

  return segmentationModel;
}

export async function segmentPerson(imageDataUrl: string): Promise<SegmentationMask> {
  const model = await initSegmentation();

  // Load and prepare image
  const img = await loadImageFromDataURL(imageDataUrl);
  const { canvas, width, height } = await resizeImage(img, 256);

  // Get image data and convert to tensor
  const imageData = getImageData(canvas);
  const inputTensor = await preprocessImage(imageData);

  try {
    // Run inference
    const outputs = model.run(inputTensor);
    const outputCpu = await outputs[0].moveTo('wasm');
    const result = outputCpu.toTypedArray() as Float32Array;

    // Convert to binary mask (0 or 255)
    const maskData = new Uint8Array(width * height);
    for (let i = 0; i < result.length; i++) {
      // Threshold at 0.5
      maskData[i] = result[i] > 0.5 ? 255 : 0;
    }

    // Cleanup
    outputCpu.delete();
    inputTensor.delete();

    return {
      data: maskData,
      width,
      height,
    };
  } catch (error) {
    inputTensor.delete();
    throw error;
  }
}

async function preprocessImage(imageData: ImageData): Promise<any> {
  const { width, height, data } = imageData;
  const inputSize = 256;

  // Convert RGBA to RGB and normalize
  const rgbData = new Float32Array(inputSize * inputSize * 3);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const pixelIndex = (i * width + j) * 4;
      const tensorIndex = (i * width + j) * 3;

      rgbData[tensorIndex] = data[pixelIndex] / 255.0;
      rgbData[tensorIndex + 1] = data[pixelIndex + 1] / 255.0;
      rgbData[tensorIndex + 2] = data[pixelIndex + 2] / 255.0;
    }
  }

  // Create tensor with shape [1, 256, 256, 3]
  const tensor = await new Tensor(rgbData, [1, inputSize, inputSize, 3]).moveTo(currentBackend);
  return tensor;
}
