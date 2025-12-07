'use client';

import { loadModel, Tensor } from './litert';
import { loadImageFromDataURL, getImageData } from './utils';

// Multiclass model configuration
// Output: [1, 256, 256, 6]
// Classes: 0:Background, 1:Hair, 2:Body, 3:Face, 4:Clothes, 5:Others
const MODEL_PATH = '/models/selfie_multiclass_256x256.tflite';
const INPUT_SIZE = 256;

let segmentationModel: Awaited<ReturnType<typeof loadModel>> | null = null;

export async function initSegmentation() {
  if (segmentationModel) return segmentationModel;

  console.log('Loading Selfie Segmentation model...');
  try {
    segmentationModel = await loadModel(MODEL_PATH, {
      accelerator: 'wasm',
    });
    console.log('Segmentation model loaded!');
    return segmentationModel;
  } catch (error) {
    console.error('Failed to load segmentation model:', error);
    throw error;
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

  // Preprocess
  const inputTensor = await preprocessImage(getImageData(canvas));

  try {
    // Inference
    console.log('Running segmentation...');
    const outputs = model.run(inputTensor);

    // Output is [1, 256, 256, 6] for multiclass
    const outputTensor = outputs[0];
    const data = outputTensor.toTypedArray() as Float32Array;

    // Create a binary mask (0 or 255)
    // We combine classes 1, 2, 3, 4 (Hair, Body, Face, Clothes) as "Person"
    const mask = new Uint8Array(INPUT_SIZE * INPUT_SIZE);
    const numClasses = 6;

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

      // Check if class is a person part (1, 2, 3, 4)
      if (maxClass >= 1 && maxClass <= 4) {
        mask[i] = 255;
      } else {
        mask[i] = 0;
      }
    }

    // Clean up input
    inputTensor.delete();
    // Clean up output tensor (important for memory management!)
    outputTensor.delete();

    return mask;

  } catch (error) {
    inputTensor.delete();
    throw error;
  }
}

async function preprocessImage(imageData: ImageData): Promise<any> {
  const { width, height, data } = imageData;

  // Create float32 buffer [1, 256, 256, 3]
  // Normalized to [0, 1]
  const floatData = new Float32Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    floatData[i * 3] = r / 255.0;
    floatData[i * 3 + 1] = g / 255.0;
    floatData[i * 3 + 2] = b / 255.0;
  }

  return Tensor.fromTypedArray(floatData, [1, width, height, 3]);
}

function keepLargestComponent(mask: Uint8Array, width: number, height: number): Uint8Array {
  const visited = new Uint8Array(width * height);
  const labels = new Int32Array(width * height).fill(0);
  let currentLabel = 1;

  const componentSizes = new Map<number, number>();

  // Use a stack for iterative DFS/BFS to avoid recursion limits
  const stack: number[] = [];

  for (let i = 0; i < width * height; i++) {
    if (mask[i] > 0 && visited[i] === 0) {
      // Start new component
      let size = 0;
      stack.push(i);
      visited[i] = 1;
      labels[i] = currentLabel;

      while (stack.length > 0) {
        const idx = stack.pop()!;
        size++;

        const cx = idx % width;
        const cy = Math.floor(idx / width);

        // Check 4-connected neighbors
        const neighbors = [
          { x: cx - 1, y: cy },
          { x: cx + 1, y: cy },
          { x: cx, y: cy - 1 },
          { x: cx, y: cy + 1 }
        ];

        for (const n of neighbors) {
          if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
            const nIdx = n.y * width + n.x;
            if (mask[nIdx] > 0 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              labels[nIdx] = currentLabel;
              stack.push(nIdx);
            }
          }
        }
      }

      componentSizes.set(currentLabel, size);
      currentLabel++;
    }
  }

  // Find largest component
  let maxSize = 0;
  let largestLabel = 0;

  componentSizes.forEach((size, label) => {
    if (size > maxSize) {
      maxSize = size;
      largestLabel = label;
    }
  });

  // Create new mask with ONLY the largest component
  const newMask = new Uint8Array(width * height);
  if (largestLabel > 0) {
    for (let i = 0; i < width * height; i++) {
      if (labels[i] === largestLabel) {
        newMask[i] = 255;
      } else {
        newMask[i] = 0;
      }
    }
  }

  return newMask;
}
