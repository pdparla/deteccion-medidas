import { PoseLandmarks, BodyMeasurements } from '@/types';
import { POSE_LANDMARKS, calculateDistance } from './poseDetection';
import { calculateScale, estimateCircumference } from './calibration';

interface AllPoses {
  front: PoseLandmarks;
  back: PoseLandmarks;
  left: PoseLandmarks;
  right: PoseLandmarks;
}

export interface CalibrationCoefficients {
  neckCoeff: number;
  shouldersCoeff: number;
  chestCoeff: number;
  waistCoeff: number;
  hipsCoeff: number;
  thighCoeff: number;
  calfCoeff: number;
  bicepCoeff: number;
}

const DEFAULT_COEFFICIENTS: CalibrationCoefficients = {
  neckCoeff: 0.37,
  shouldersCoeff: 0.80,
  chestCoeff: 0.72,
  waistCoeff: 1.09,
  hipsCoeff: 0.98,
  thighCoeff: 1.15,
  calfCoeff: 0.89,
  bicepCoeff: 1.47,
};

export async function calculateBodyMeasurements(
  poses: AllPoses,
  userHeight: number,
  coefficients: CalibrationCoefficients = DEFAULT_COEFFICIENTS
): Promise<BodyMeasurements> {
  // Calcular escala usando la foto frontal
  const scale = calculateScale(poses.front, userHeight);

  // Calcular cada medida
  const measurements: BodyMeasurements = {
    neck: calculateNeck(poses.front, poses.left, scale, coefficients.neckCoeff),
    shoulders: calculateShoulders(poses.front, scale, coefficients.shouldersCoeff),
    chest: calculateChest(poses.front, poses.left, scale, coefficients.chestCoeff),
    waist: calculateWaist(poses.front, poses.left, scale, coefficients.waistCoeff),
    hips: calculateHips(poses.front, poses.left, scale, coefficients.hipsCoeff),
    thigh: calculateThigh(poses.front, poses.left, scale, coefficients.thighCoeff),
    calf: calculateCalf(poses.front, poses.left, scale, coefficients.calfCoeff),
    bicep: calculateBicep(poses.front, poses.left, scale, coefficients.bicepCoeff),
  };

  return measurements;
}

function calculateNeck(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Aproximar ancho del cuello usando oídos (frente)
  const leftEar = frontLandmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = frontLandmarks[POSE_LANDMARKS.RIGHT_EAR];
  const frontWidth = calculateDistance(leftEar, rightEar, fw, fh) * scale;

  // Aproximar profundidad del cuello (lateral)
  const sideEar = sideLandmarks[POSE_LANDMARKS.LEFT_EAR];
  const sideShoulder = sideLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const sideDepth = Math.abs((sideEar.x - sideShoulder.x) * sw) * scale * 0.3;

  return estimateCircumference(frontWidth, sideDepth) * coeff;
}

function calculateShoulders(front: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks, imageWidth, imageHeight } = front;

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  const distance = calculateDistance(leftShoulder, rightShoulder, imageWidth, imageHeight);

  return distance * scale * coeff;
}

function calculateChest(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho del pecho (distancia entre hombros)
  const leftShoulder = frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = frontLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const frontWidth = calculateDistance(leftShoulder, rightShoulder, fw, fh) * scale * 1.0;

  // Profundidad del pecho (lateral) - estimada desde hombro
  const sideShoulder = sideLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const sideHip = sideLandmarks[POSE_LANDMARKS.LEFT_HIP];

  // Estimar profundidad del torso a nivel del pecho
  const torsoDepth = Math.abs((sideShoulder.x - sideHip.x) * sw) * scale * 0.5;

  return estimateCircumference(frontWidth, torsoDepth) * coeff;
}

function calculateWaist(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho de cintura (usando caderas como referencia)
  const leftHip = frontLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = frontLandmarks[POSE_LANDMARKS.RIGHT_HIP];
  const frontWidth = calculateDistance(leftHip, rightHip, fw, fh) * scale * 0.85;

  // Profundidad de cintura (lateral)
  const sideHip = sideLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const sideShoulder = sideLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];

  // Punto medio del torso para cintura
  const waistX = sideShoulder.x + (sideHip.x - sideShoulder.x) * 0.6;
  const sideDepth = Math.abs(waistX * sw - sideShoulder.x * sw) * scale * 0.65;

  return estimateCircumference(frontWidth, sideDepth) * coeff;
}

function calculateHips(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho de cadera
  const leftHip = frontLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = frontLandmarks[POSE_LANDMARKS.RIGHT_HIP];
  const frontWidth = calculateDistance(leftHip, rightHip, fw, fh) * scale;

  // Profundidad de cadera (lateral)
  const sideHip = sideLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const sideShoulder = sideLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const sideDepth = Math.abs((sideHip.x - sideShoulder.x) * sw) * scale * 0.6;

  return estimateCircumference(frontWidth, sideDepth) * coeff;
}

function calculateThigh(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho del muslo (parte superior de la pierna)
  const leftHip = frontLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const leftKnee = frontLandmarks[POSE_LANDMARKS.LEFT_KNEE];

  // Aproximar ancho del muslo como porción del ancho de cadera
  const hipWidth = calculateDistance(
    frontLandmarks[POSE_LANDMARKS.LEFT_HIP],
    frontLandmarks[POSE_LANDMARKS.RIGHT_HIP],
    fw,
    fh
  ) * scale * 0.55;

  // Profundidad del muslo (lateral)
  const sideHip = sideLandmarks[POSE_LANDMARKS.LEFT_HIP];
  const sideKnee = sideLandmarks[POSE_LANDMARKS.LEFT_KNEE];

  // Punto en la parte superior del muslo
  const thighX = sideHip.x + (sideKnee.x - sideHip.x) * 0.3;
  const thighDepth = Math.abs(thighX * sw - sideKnee.x * sw) * scale * 0.9;

  return estimateCircumference(hipWidth, thighDepth) * coeff;
}

function calculateCalf(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho del gemelo
  const leftKnee = frontLandmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = frontLandmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const kneeWidth = calculateDistance(leftKnee, rightKnee, fw, fh) * scale * 0.35;

  // Profundidad del gemelo (lateral)
  const sideKnee = sideLandmarks[POSE_LANDMARKS.LEFT_KNEE];
  const sideAnkle = sideLandmarks[POSE_LANDMARKS.LEFT_ANKLE];

  // Punto medio de la pantorrilla (donde está el gemelo más prominente)
  const calfX = sideKnee.x + (sideAnkle.x - sideKnee.x) * 0.4;
  const calfDepth = Math.abs(calfX * sw - sideAnkle.x * sw) * scale * 0.5;

  return estimateCircumference(kneeWidth, calfDepth) * coeff;
}

function calculateBicep(front: PoseLandmarks, side: PoseLandmarks, scale: number, coeff: number): number {
  const { landmarks: frontLandmarks, imageWidth: fw, imageHeight: fh } = front;
  const { landmarks: sideLandmarks, imageWidth: sw, imageHeight: sh } = side;

  // Ancho del bíceps (distancia de hombro a codo como referencia)
  const leftShoulder = frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const leftElbow = frontLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const armLength = calculateDistance(leftShoulder, leftElbow, fw, fh);
  const bicepWidth = armLength * scale * 0.35;

  // Profundidad del bíceps (lateral)
  const sideShoulder = sideLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const sideElbow = sideLandmarks[POSE_LANDMARKS.LEFT_ELBOW];

  // Punto medio del brazo
  const bicepX = sideShoulder.x + (sideElbow.x - sideShoulder.x) * 0.4;
  const bicepDepth = Math.abs(bicepX * sw - sideElbow.x * sw) * scale * 0.5;

  return estimateCircumference(bicepWidth, bicepDepth) * coeff;
}
