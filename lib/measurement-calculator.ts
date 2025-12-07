import { BodyMeasurements, ProcessedCapture, Keypoint } from '@/types/measurement';
import { calculatePixelsPerCm } from './calibration-new';
import { KEYPOINTS } from '@/types/pose';

/**
 * Calculate body measurements from pose keypoints using anthropometric ratios.
 * Without segmentation, we estimate measurements based on skeletal landmarks.
 */
export async function calculateBodyMeasurements(
  captures: ProcessedCapture[],
  userHeightCm: number
): Promise<BodyMeasurements> {
  // Find front capture (only one required for keypoint-based measurements)
  const frontCapture = captures.find((c) => c.view === 'front');

  if (!frontCapture) {
    throw new Error('Front capture is required');
  }

  // Calculate calibration scale from front view
  const pixelsPerCm = calculatePixelsPerCm(frontCapture.keypoints, userHeightCm);

  // Calculate each measurement using keypoint-based estimation
  const measurements: BodyMeasurements = {
    neck: calculateNeckFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    shoulders: calculateShoulderWidth(frontCapture.keypoints, pixelsPerCm),
    chest: calculateChestFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    waist: calculateWaistFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    hips: calculateHipsFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    biceps: calculateBicepsFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    thighs: calculateThighsFromKeypoints(frontCapture.keypoints, pixelsPerCm),
    calves: calculateCalvesFromKeypoints(frontCapture.keypoints, pixelsPerCm),
  };

  return measurements;
}

function calculateShoulderWidth(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];

  const widthPx = Math.abs(rightShoulder.x - leftShoulder.x);
  return widthPx / pixelsPerCm;
}

function calculateNeckFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  // Estimate neck circumference from shoulder width
  // Anthropometric ratio: neck ≈ 0.5 × shoulder width
  const shoulderWidth = calculateShoulderWidth(keypoints, pixelsPerCm);

  // Average neck diameter is ~50% of shoulder width
  const neckDiameter = shoulderWidth * 0.5;

  // Convert diameter to circumference
  return neckDiameter * Math.PI;
}

function calculateChestFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];

  // Chest width at shoulder level
  const chestWidthPx = Math.abs(rightShoulder.x - leftShoulder.x);
  const chestWidthCm = chestWidthPx / pixelsPerCm;

  // Estimate depth as 70% of width (typical torso proportions)
  const depthCm = chestWidthCm * 0.7;

  // Calculate circumference using ellipse formula: π × (3(a+b) - sqrt((3a+b)(a+3b)))
  const a = chestWidthCm / 2;
  const b = depthCm / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function calculateWaistFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
  const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];

  // Waist is typically at hip keypoint level
  const waistWidthPx = Math.abs(rightHip.x - leftHip.x);
  const waistWidthCm = waistWidthPx / pixelsPerCm;

  // Estimate depth as 60% of width (waist is typically flatter)
  const depthCm = waistWidthCm * 0.6;

  // Ellipse circumference
  const a = waistWidthCm / 2;
  const b = depthCm / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function calculateHipsFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
  const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];

  // Hip width
  const hipWidthPx = Math.abs(rightHip.x - leftHip.x);
  const hipWidthCm = hipWidthPx / pixelsPerCm;

  // Hips are typically wider and rounder
  const depthCm = hipWidthCm * 0.85;

  // Ellipse circumference
  const a = hipWidthCm / 2;
  const b = depthCm / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function calculateBicepsFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
  const rightElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];

  // Estimate arm width from shoulder to elbow horizontal distance
  // Take average of both arms
  const leftArmWidthPx = Math.abs(leftElbow.x - leftShoulder.x);
  const rightArmWidthPx = Math.abs(rightElbow.x - rightShoulder.x);
  const armWidthPx = (leftArmWidthPx + rightArmWidthPx) / 2;

  // Biceps diameter is typically 40-50% of the horizontal arm span
  const bicepsDiameterCm = (armWidthPx / pixelsPerCm) * 0.45;

  // Estimate depth (front-to-back) as 90% of width (arms are relatively round)
  const bicepsDepthCm = bicepsDiameterCm * 0.9;

  // Calculate circumference using ellipse formula
  const a = bicepsDiameterCm / 2;
  const b = bicepsDepthCm / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function calculateThighsFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
  const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE];

  // Thigh length
  const thighLengthPx = Math.sqrt(
    Math.pow(leftKnee.x - leftHip.x, 2) +
    Math.pow(leftKnee.y - leftHip.y, 2)
  );
  const thighLengthCm = thighLengthPx / pixelsPerCm;

  // Thigh circumference is typically ~55-60% of thigh length
  return thighLengthCm * 0.57;
}

function calculateCalvesFromKeypoints(
  keypoints: Keypoint[],
  pixelsPerCm: number
): number {
  const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE];
  const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];

  // Calf length
  const calfLengthPx = Math.sqrt(
    Math.pow(leftAnkle.x - leftKnee.x, 2) +
    Math.pow(leftAnkle.y - leftKnee.y, 2)
  );
  const calfLengthCm = calfLengthPx / pixelsPerCm;

  // Calf circumference is typically ~40-45% of calf length
  return calfLengthCm * 0.42;
}
