
import { BodyMeasurements, ProcessedCapture, Keypoint, SegmentationMask } from '@/types/measurement';
import { calculatePixelsPerCm, calculatePixelsPerCmFromMask, getYPositionForMeasurement } from './calibration-new';
import { KEYPOINTS } from '@/types/pose';

/**
 * Calculate body measurements using segmentation masks and pose keypoints.
 * Uses Ramanujan's approximation for ellipse circumference:
 * C ≈ π * [3(a+b) - sqrt((3a+b)(a+3b))]
 * where a = width/2 and b = depth/2
 */
export async function calculateBodyMeasurements(
  captures: ProcessedCapture[],
  userHeightCm: number
): Promise<BodyMeasurements> {
  const frontCapture = captures.find((c) => c.view === 'front');
  const sideCapture = captures.find((c) => c.view === 'right') || captures.find((c) => c.view === 'left');

  if (!frontCapture || !sideCapture) {
    throw new Error('Front and Side (Right or Left) captures are required');
  }

  // 1. Calibration: ALWAYS work in Original Image Space to preserve aspect ratio
  let pixelsPerCm = 0;
  if (frontCapture.mask) {
    const heightInMask = getMaskHeight(frontCapture.mask);
    const heightPxOriginal = heightInMask * (frontCapture.imageHeight / 256); // Scale Y

    if (heightPxOriginal > 0) {
      pixelsPerCm = heightPxOriginal / userHeightCm;
    }
  }

  if (pixelsPerCm === 0) {
    console.warn("Using keypoint calibration fallback");
    pixelsPerCm = calculatePixelsPerCm(frontCapture.keypoints, userHeightCm);
  }

  // 2. Measure
  const measure = (type: string) => measureSegment(type, frontCapture, sideCapture, pixelsPerCm);

  // Specific implementations
  const neck = measure('neck');

  // Shoulders: Linear Width
  let shoulders = 0;
  if (frontCapture.mask) {
    shoulders = measureLinearWidthOriginal(frontCapture, 'shoulders', pixelsPerCm);
  } else {
    shoulders = 0;
  }

  const chest = measure('chest');
  const waist = measure('waist');
  const hips = measure('hips');
  const biceps = measure('biceps');
  const thighs = measure('thighs');
  const calves = measure('calves');

  return {
    neck,
    shoulders,
    chest,
    waist,
    hips,
    biceps,
    thighs,
    calves
  };
}

// --------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------

function measureSegment(
  type: string,
  frontCapture: ProcessedCapture,
  sideCapture: ProcessedCapture,
  pixelsPerCm: number
): number {
  // We work in 256x256 mask logic for finding pixels, but project to original for physical calculation.
  const isMaskMode = !!frontCapture.mask;

  // Measurement Y-Level:
  // Keypoints are in Original Space.
  // We need to map Original Y -> Mask Y (256) to look up the mask.
  const yLevelOriginal = getYPositionForMeasurement(frontCapture.keypoints, type);
  const yLevelMask = Math.round(yLevelOriginal * (256 / frontCapture.imageHeight));

  // Get Width (Front View)
  let widthCm = 0;

  // Determine Center X in MASK Space (256)
  let centerXMask = -1;
  if (isMaskMode) {
    if (type === 'neck' || type === 'shoulders' || type === 'chest' || type === 'waist' || type === 'hips') {
      const avgS = (frontCapture.keypoints[KEYPOINTS.LEFT_SHOULDER].x + frontCapture.keypoints[KEYPOINTS.RIGHT_SHOULDER].x) / 2;
      const avgH = (frontCapture.keypoints[KEYPOINTS.LEFT_HIP].x + frontCapture.keypoints[KEYPOINTS.RIGHT_HIP].x) / 2;
      const centerXOriginal = (avgS + avgH) / 2;

      if (type === 'hips') centerXMask = ((frontCapture.keypoints[KEYPOINTS.LEFT_HIP].x + frontCapture.keypoints[KEYPOINTS.RIGHT_HIP].x) / 2) * (256 / frontCapture.imageWidth);
      else if (type === 'chest') centerXMask = ((frontCapture.keypoints[KEYPOINTS.LEFT_SHOULDER].x + frontCapture.keypoints[KEYPOINTS.RIGHT_SHOULDER].x) / 2) * (256 / frontCapture.imageWidth);
      else centerXMask = centerXOriginal * (256 / frontCapture.imageWidth);

    } else if (type === 'biceps') {
      const s = frontCapture.keypoints[KEYPOINTS.LEFT_SHOULDER];
      const e = frontCapture.keypoints[KEYPOINTS.LEFT_ELBOW];
      centerXMask = ((s.x + e.x) / 2) * (256 / frontCapture.imageWidth);
    } else if (type === 'thighs') {
      const h = frontCapture.keypoints[KEYPOINTS.LEFT_HIP];
      const k = frontCapture.keypoints[KEYPOINTS.LEFT_KNEE];
      // Measure at MIDPOINT between Hip and Knee for better separation
      centerXMask = ((h.x + k.x) / 2) * (256 / frontCapture.imageWidth);
    } else if (type === 'calves') {
      const k = frontCapture.keypoints[KEYPOINTS.LEFT_KNEE];
      const a = frontCapture.keypoints[KEYPOINTS.LEFT_ANKLE];
      centerXMask = ((k.x + a.x) / 2) * (256 / frontCapture.imageWidth);
    }
  }

  if (frontCapture.mask && isMaskMode && centerXMask !== -1) {
    // Define boundaries
    let minXMask = 0;
    let maxXMask = 256;

    const scaleToMask = (val: number) => val * (256 / frontCapture.imageWidth);

    // Keypoints for bounds
    const leftS = frontCapture.keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rightS = frontCapture.keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const leftH = frontCapture.keypoints[KEYPOINTS.LEFT_HIP];
    const rightH = frontCapture.keypoints[KEYPOINTS.RIGHT_HIP];

    // Midline of body (approx spine)
    const spineX = (leftS.x + rightS.x + leftH.x + rightH.x) / 4;
    const spineXMask = scaleToMask(spineX);

    const centerXOriginal = centerXMask * (frontCapture.imageWidth / 256);

    // Determine if the part we are measuring is Left or Right of spine (in Image Space)
    const isRightOfSpine = centerXOriginal > spineX;

    if (type === 'chest' || type === 'waist' || type === 'hips') {
      // Torso isolation. Stop at arms.

      if (type === 'hips') {
        // Hips isolation. Stop at hands/wrists.
        const buffer = scaleToMask(30);
        const rightLimit = rightH.x;
        minXMask = scaleToMask(rightLimit) - buffer;
        const leftLimit = leftH.x;
        maxXMask = scaleToMask(leftLimit) + buffer;
      } else {
        // Chest/Waist isolation.
        // Reduce buffer to 0 or negative/positive based on type
        let buffer = 0;
        if (type === 'chest') buffer = scaleToMask(0); // No contraction, full width
        else if (type === 'waist') buffer = -scaleToMask(4); // Waist: Negative buffer (-4px)
        else buffer = scaleToMask(0); // Others

        // User Right (Image Left)
        const rightLimit = Math.min(rightS.x, rightH.x);
        minXMask = scaleToMask(rightLimit) - buffer;

        // User Left (Image Right)
        const leftLimit = Math.max(leftS.x, leftH.x);
        maxXMask = scaleToMask(leftLimit) + buffer;
      }

    } else if (type === 'biceps') {
      // Arm isolation. Stop at shoulder/torso edge.
      const buffer = scaleToMask(30); // INCREASED to 30px to allow more overlap with torso (fix under-measurement)

      if (isRightOfSpine) {
        // Measuring User's Left Arm
        const shoulderX = leftS.x;
        minXMask = scaleToMask(shoulderX) - buffer;
      } else {
        // Measuring User's Right Arm
        const shoulderX = rightS.x;
        maxXMask = scaleToMask(shoulderX) + buffer;
      }
    } else if (type === 'thighs') {
      // Leg isolation.
      // Inner bound: Splitting the legs.
      // Use the midpoint between hips as the absolute center (crotch).
      const pelvicCenter = (leftH.x + rightH.x) / 2;
      const pelvicCenterMask = scaleToMask(pelvicCenter);
      const crotchBuffer = scaleToMask(10); // 10px buffer to separate legs

      if (isRightOfSpine) {
        // Left Leg (Image Right)
        minXMask = pelvicCenterMask + crotchBuffer;
      } else {
        // Right Leg (Image Left)
        maxXMask = pelvicCenterMask - crotchBuffer;
      }
    } else if (type === 'calves') {
      if (isRightOfSpine) {
        minXMask = spineXMask;
      } else {
        maxXMask = spineXMask;
      }
    }

    // Width in MASK pixels with bounds
    let widthInMask = 0;

    // For Torso/Head parts (Neck, Shoulders, Chest, Waist, Hips), use OUTER width (bounding box row).
    // This handles gaps (e.g. between legs for Hips) by measuring the full span.
    if (['neck', 'shoulders', 'chest', 'waist', 'hips'].includes(type)) {
      widthInMask = getOuterMaskWidth(frontCapture.mask, yLevelMask, Math.round(minXMask), Math.round(maxXMask));
    } else {
      // For Limbs (Biceps, Thighs, Calves), use SEGMENT width (contiguous blob).
      // This prevents measuring across to the other limb or body.
      widthInMask = getMaskSegmentWidth(frontCapture.mask, yLevelMask, Math.round(centerXMask), Math.round(minXMask), Math.round(maxXMask));
    }

    // Scale X-axis from 256 to Original Width
    const widthPxOriginal = widthInMask * (frontCapture.imageWidth / 256);

    widthCm = widthPxOriginal / pixelsPerCm;
  } else {
    return 0;
  }

  // Get Depth (Side View)
  let depthCm = 0;

  // For cylindrical limbs (Arms/Legs), assume circular cross-section (Width == Depth)
  if (type === 'biceps' || type === 'thighs' || type === 'calves') {
    depthCm = widthCm;
  } else if (sideCapture.mask && isMaskMode) {
    // Map Y level to Side View Mask
    const sideYLevelOriginal = getYPositionForMeasurement(sideCapture.keypoints, type);
    const sideYLevelMask = Math.round(sideYLevelOriginal * (256 / sideCapture.imageHeight));

    let sideCenterXMask = 128; // Default center

    // Calculate CenterX for side view in MASK space based on keypoints
    if (type === 'chest' || type === 'waist' || type === 'hips' || type === 'neck' || type === 'shoulders') {
      const hipsParams = sideCapture.keypoints[KEYPOINTS.RIGHT_HIP];
      // Use average of visible keypoints to find center vertical line
      sideCenterXMask = hipsParams.x * (256 / sideCapture.imageWidth);
    }

    // SMART DEPTH CLAMP: Use Front Width to constrain Side Search
    // We expect Depth to be roughly similar to Width (human torso ratio 0.7 - 0.9 usually)
    // Allow max depth = Width * 1.1 as a safe upper bound.
    // Convert MaxDepthCm -> MaxDepthPx (Side View)

    const maxDepthPxOriginal = (widthCm * 1.1) * pixelsPerCm;
    const maxDepthPxMask = maxDepthPxOriginal * (256 / sideCapture.imageWidth);
    const searchRadius = Math.max(10, Math.round(maxDepthPxMask / 2));

    const minXSide = Math.max(0, sideCenterXMask - searchRadius);
    const maxXSide = Math.min(255, sideCenterXMask + searchRadius);

    const depthInMask = getMaskSegmentWidth(sideCapture.mask, sideYLevelMask, Math.round(sideCenterXMask), Math.round(minXSide), Math.round(maxXSide));

    // Scale X-axis for Side View
    const depthPxOriginal = depthInMask * (sideCapture.imageWidth / 256);

    depthCm = depthPxOriginal / pixelsPerCm;

    // Secondary Safety Clamp: Depth unlikely to exceed Width for Torso/Neck
    if (depthCm > widthCm * 0.95) {
      depthCm = widthCm * 0.95;
    }
  } else {
    depthCm = widthCm * (type === 'chest' ? 0.7 : type === 'waist' ? 0.6 : 0.85);
  }

  if (widthCm === 0) return 0;

  const a = widthCm / 2;
  const b = depthCm > 0 ? depthCm / 2 : a;
  const circumference = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

  return circumference;
}


function measureLinearWidthOriginal(capture: ProcessedCapture, type: string, pixelsPerCm: number): number {
  if (!capture.mask) return 0;

  const leftS = capture.keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightS = capture.keypoints[KEYPOINTS.RIGHT_SHOULDER];

  // Center in Mask Space
  const centerXMask = ((leftS.x + rightS.x) / 2) * (256 / capture.imageWidth);

  // Y Level in Mask Space
  const yLevelOriginal = getYPositionForMeasurement(capture.keypoints, type);
  const yLevelMask = Math.round(yLevelOriginal * (256 / capture.imageHeight));

  // Scan range in Mask Space
  const range = capture.mask.height * 0.05;
  let maxWidthMask = 0;

  for (let y = Math.max(0, yLevelMask - range); y < Math.min(capture.mask.height, yLevelMask + range); y++) {
    const w = getMaskSegmentWidth(capture.mask, Math.floor(y), Math.round(centerXMask));
    if (w > maxWidthMask) maxWidthMask = w;
  }

  // Convert Max Width to Original Space
  const maxWidthOriginal = maxWidthMask * (capture.imageWidth / 256);

  return maxWidthOriginal / pixelsPerCm;
}

function getMaskHeight(mask: SegmentationMask): number {
  const { data, width, height } = mask;
  let topY = height;
  let bottomY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] > 0) {
        if (y < topY) topY = y;
        if (y > bottomY) bottomY = y;
      }
    }
  }
  if (bottomY <= topY) return 0;
  return bottomY - topY;
}

/**
 * Calculates the width of a continuous mask segment at a given Y level,
 * starting the search from a center X point, constrained by min/max X.
 */
function getMaskSegmentWidth(
  mask: SegmentationMask,
  y: number,
  centerX: number,
  minX: number = 0,
  maxX: number = 9999
): number {
  if (y < 0 || y >= mask.height) return 0;
  if (centerX < 0 || centerX >= mask.width) return 0;

  // Clamp boundaries to image size
  minX = Math.max(0, minX);
  maxX = Math.min(mask.width - 1, maxX);

  // If center is out of bounds, return 0 (or clamp center?)
  if (centerX < minX || centerX > maxX) {
    // Try to clamp?
    centerX = Math.max(minX, Math.min(maxX, centerX));
  }

  const rowStart = y * mask.width;

  let startX = centerX;
  let endX = centerX;

  // Verify center pixel has mask, otherwise search nearby WITHIN bounds
  if (mask.data[rowStart + centerX] === 0) {
    let dist = 1;
    let found = false;
    while (true) {
      let left = centerX - dist;
      let right = centerX + dist;

      // Stop if both directions are exhausted or out of bounds
      if (left < minX && right > maxX) break;

      if (left >= minX && mask.data[rowStart + left] > 0) {
        startX = endX = left;
        found = true;
        break;
      }
      if (right <= maxX && mask.data[rowStart + right] > 0) {
        startX = endX = right;
        found = true;
        break;
      }
      dist++;
      if (dist > 50) break;
    }
    if (!found) return 0;
  }

  // Expand Left
  while (startX > minX && mask.data[rowStart + startX - 1] > 0) {
    startX--;
  }

  // Expand Right
  while (endX < maxX && mask.data[rowStart + endX + 1] > 0) {
    endX++;
  }

  return (endX - startX + 1);
}

/**
 * Calculates the width from the left-most pixel to the right-most pixel
 * within the given X bounds at a specific Y level.
 * Ignored gaps in between.
 */
function getOuterMaskWidth(
  mask: SegmentationMask,
  y: number,
  minX: number = 0,
  maxX: number = 9999
): number {
  if (y < 0 || y >= mask.height) return 0;

  // Clamp boundaries
  minX = Math.max(0, minX);
  maxX = Math.min(mask.width - 1, maxX);

  const rowStart = y * mask.width;

  // Find First Pixel (Left)
  let startX = -1;
  for (let x = minX; x <= maxX; x++) {
    if (mask.data[rowStart + x] > 0) {
      startX = x;
      break;
    }
  }

  if (startX === -1) return 0; // No pixels found

  // Find Last Pixel (Right)
  let endX = startX;
  for (let x = maxX; x >= startX; x--) {
    if (mask.data[rowStart + x] > 0) {
      endX = x;
      break;
    }
  }

  return (endX - startX + 1);
}
