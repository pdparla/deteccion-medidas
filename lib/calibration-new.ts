import { Keypoint, SegmentationMask } from '@/types/measurement';
import { KEYPOINTS } from '@/types/pose';
import { calculateDistance } from './pose-detection';

export function calculatePixelsPerCmFromMask(
  mask: SegmentationMask,
  userHeightCm: number
): number {
  const { data, width, height } = mask;

  // Find top and bottom pixels of the person
  let topY = height;
  let bottomY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] > 0) { // If pixel is part of person
        if (y < topY) topY = y;
        if (y > bottomY) bottomY = y;
      }
    }
  }

  // Safety check
  if (bottomY <= topY) {
    console.warn("Could not detect person height from mask, returning 0");
    return 0;
  }

  const bodyHeightPx = bottomY - topY;

  // Return pixels per cm ratio
  return bodyHeightPx / userHeightCm;
}

export function calculatePixelsPerCm(
  keypoints: Keypoint[],
  userHeightCm: number
): number {
  // Get ankle to head distance in pixels
  const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];
  const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE];
  const nose = keypoints[KEYPOINTS.NOSE];
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];

  // Average ankle position
  const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;

  // Head top estimation (above nose)
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const noseToShoulder = Math.abs(nose.y - shoulderMidY);
  const headTopY = nose.y - noseToShoulder * 0.5; // Estimate head top

  // Body height in pixels
  const bodyHeightPx = Math.abs(avgAnkleY - headTopY);

  // Return pixels per cm ratio
  return bodyHeightPx / userHeightCm;
}

export function getYPositionForMeasurement(
  keypoints: Keypoint[],
  measurementType: string
): number {
  const nose = keypoints[KEYPOINTS.NOSE];
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
  const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];
  const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE];
  const rightKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
  const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];
  const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE];

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const kneeY = (leftKnee.y + rightKnee.y) / 2;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

  switch (measurementType) {
    case 'neck':
      // 30% down from nose to shoulders
      return nose.y + (shoulderY - nose.y) * 0.3;

    case 'shoulders':
      return shoulderY;

    case 'chest':
      // 20% down from shoulders to hips (Higher -> Pecs/Lats)
      return shoulderY + (hipY - shoulderY) * 0.20;

    case 'waist':
      // 60% down from shoulders to hips (narrowest point)
      return shoulderY + (hipY - shoulderY) * 0.6;

    case 'hips':
      // Measure at widest part of buttocks
      // Approx 18% down towards knees
      return hipY + (kneeY - hipY) * 0.18;

    case 'biceps':
      // Use left arm as reference
      const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
      return leftShoulder.y + (leftElbow.y - leftShoulder.y) * 0.5;

    case 'thighs':
      // 30% down from hip to knee (lower to find gap)
      return hipY + (kneeY - hipY) * 0.30;

    case 'calves':
      // 40% down from knee to ankle (widest part of calf)
      return kneeY + (ankleY - kneeY) * 0.4;

    default:
      return hipY;
  }
}

export function getXPositionForLimb(
  keypoints: Keypoint[],
  measurementType: string,
  side: 'left' | 'right' = 'left'
): number {
  if (measurementType === 'biceps') {
    const shoulder = side === 'left'
      ? keypoints[KEYPOINTS.LEFT_SHOULDER]
      : keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const elbow = side === 'left'
      ? keypoints[KEYPOINTS.LEFT_ELBOW]
      : keypoints[KEYPOINTS.RIGHT_ELBOW];

    return shoulder.x + (elbow.x - shoulder.x) * 0.5;
  }

  // For legs, use hip/knee/ankle
  const hip = side === 'left'
    ? keypoints[KEYPOINTS.LEFT_HIP]
    : keypoints[KEYPOINTS.RIGHT_HIP];

  return hip.x;
}
