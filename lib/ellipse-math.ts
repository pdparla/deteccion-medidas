export function calculateCircumference(widthCm: number, depthCm: number): number {
  const a = widthCm / 2; // semi-major axis
  const b = depthCm / 2; // semi-minor axis

  // Ramanujan's approximation for ellipse circumference
  const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

export function calculateEllipseArea(widthCm: number, depthCm: number): number {
  const a = widthCm / 2;
  const b = depthCm / 2;
  return Math.PI * a * b;
}

export function averageCircumferences(c1: number, c2: number): number {
  // Weighted average favoring the larger circumference slightly
  // to account for muscle/tissue compression in photos
  return (c1 * 0.6 + c2 * 0.4);
}
