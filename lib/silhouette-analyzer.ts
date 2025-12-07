import { SegmentationMask } from '@/types/measurement';

export interface SilhouetteWidth {
  left: number;
  right: number;
  widthPx: number;
  centerX: number;
}

export function extractWidthAtY(
  mask: SegmentationMask,
  y: number
): SilhouetteWidth | null {
  const { data, width, height } = mask;

  if (y < 0 || y >= height) return null;

  const rowStart = Math.floor(y) * width;
  let left = -1;
  let right = -1;

  // Find left edge
  for (let x = 0; x < width; x++) {
    if (data[rowStart + x] > 128) {
      left = x;
      break;
    }
  }

  // Find right edge
  for (let x = width - 1; x >= 0; x--) {
    if (data[rowStart + x] > 128) {
      right = x;
      break;
    }
  }

  if (left === -1 || right === -1) return null;

  return {
    left,
    right,
    widthPx: right - left,
    centerX: (left + right) / 2,
  };
}

export function extractAverageWidth(
  mask: SegmentationMask,
  centerY: number,
  sampleRows: number = 5
): number | null {
  const widths: number[] = [];
  const halfSample = Math.floor(sampleRows / 2);

  for (let offset = -halfSample; offset <= halfSample; offset++) {
    const result = extractWidthAtY(mask, centerY + offset);
    if (result) widths.push(result.widthPx);
  }

  if (widths.length === 0) return null;

  // Return median to avoid outliers
  widths.sort((a, b) => a - b);
  const mid = Math.floor(widths.length / 2);

  if (widths.length % 2 === 0) {
    return (widths[mid - 1] + widths[mid]) / 2;
  } else {
    return widths[mid];
  }
}

export function findBodyBounds(mask: SegmentationMask): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const { data, width, height } = mask;

  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (data[index] > 128) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }

  return { top, bottom, left, right };
}

export function validateMask(mask: SegmentationMask): boolean {
  const { data } = mask;

  // Count person pixels
  let personPixels = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 128) personPixels++;
  }

  const totalPixels = data.length;
  const personRatio = personPixels / totalPixels;

  // Person should occupy between 15% and 85% of the image
  return personRatio >= 0.15 && personRatio <= 0.85;
}
