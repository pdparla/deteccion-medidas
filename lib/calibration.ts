import { PoseLandmarks } from '@/types';
import { POSE_LANDMARKS, calculateDistance } from './poseDetection';

/**
 * Calcula la escala de píxeles a centímetros usando la altura del usuario
 * como referencia y la distancia de nariz a tobillos en la foto frontal
 */
export function calculateScale(
  frontPose: PoseLandmarks,
  userHeight: number
): number {
  const { landmarks, imageWidth, imageHeight } = frontPose;

  // Usar la distancia de nariz a promedio de tobillos
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  // Calcular tobillo promedio
  const avgAnkle = {
    x: (leftAnkle.x + rightAnkle.x) / 2,
    y: (leftAnkle.y + rightAnkle.y) / 2,
    z: 0,
  };

  // Distancia en píxeles de nariz a tobillos
  const pixelHeight = calculateDistance(nose, avgAnkle, imageWidth, imageHeight);

  // La altura del usuario en cm dividida por la altura en píxeles
  // nos da la escala cm/pixel
  const scale = userHeight / pixelHeight;

  return scale;
}

/**
 * Estima la profundidad/circunferencia usando información lateral
 * Aproximación básica: usar la dimensión lateral como diámetro
 */
export function estimateCircumference(
  frontWidth: number,
  sideDepth: number
): number {
  // Aproximar como elipse: circunferencia ≈ π * √(2(a² + b²))
  // donde a = frontWidth/2 y b = sideDepth/2
  const a = frontWidth / 2;
  const b = sideDepth / 2;

  const circumference = Math.PI * Math.sqrt(2 * (a * a + b * b));

  return circumference;
}
