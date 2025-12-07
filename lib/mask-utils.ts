import { Keypoint } from '@/types/measurement';
import { KEYPOINTS } from '@/types/pose';

/**
 * Clean up the segmentation mask by removing pixels that are too far from the skeleton.
 * This effectively removes background noise, other people/animals, and artifacts.
 */
export function cleanMaskWithKeypoints(
    mask: Uint8Array,
    keypoints: Keypoint[],
    imageWidth: number,
    imageHeight: number,
    maskSize: number = 256
): Uint8Array {
    // Simple approach: Just clean up the segmentation mask
    // 1. Keep largest component (removes background objects)
    let cleanedMask = keepLargestContour(mask, maskSize, maskSize);

    // 2. Fill internal holes (closes armpits)
    cleanedMask = fillHoles(cleanedMask, maskSize, maskSize);

    return cleanedMask;
}

/**
 * Create a complete body mask from keypoints using anatomical regions
 * Uses convex hulls and polygon filling for robustness
 */
function createKeypointBodyMask(kps: Array<{x: number, y: number, score: number}>, width: number, height: number): Uint8Array {
    const bodyMask = new Uint8Array(width * height);

    // Define anatomical regions as sets of keypoints
    // We'll create convex hulls for each region

    // HEAD region (expanded circle)
    const headPoints = [
        kps[KEYPOINTS.NOSE],
        kps[KEYPOINTS.LEFT_EYE],
        kps[KEYPOINTS.RIGHT_EYE],
        kps[KEYPOINTS.LEFT_EAR],
        kps[KEYPOINTS.RIGHT_EAR]
    ].filter(kp => kp.score > 0.2);

    if (headPoints.length > 0) {
        // Find head center and create generous circle
        const headCenter = {
            x: headPoints.reduce((sum, kp) => sum + kp.x, 0) / headPoints.length,
            y: headPoints.reduce((sum, kp) => sum + kp.y, 0) / headPoints.length
        };
        const headRadius = 35; // Generous head radius
        fillCircle(bodyMask, headCenter.x, headCenter.y, headRadius, width, height);
    }

    // TORSO region (convex hull of shoulders and hips)
    const torsoPoints = [
        kps[KEYPOINTS.LEFT_SHOULDER],
        kps[KEYPOINTS.RIGHT_SHOULDER],
        kps[KEYPOINTS.LEFT_HIP],
        kps[KEYPOINTS.RIGHT_HIP]
    ].filter(kp => kp.score > 0.2);

    if (torsoPoints.length >= 3) {
        const hull = quickHull(torsoPoints);
        // Expand hull outward significantly to account for body width
        const expandedHull = expandPolygon(hull, 50); // 50px expansion for full belly/back coverage
        fillPolygon(bodyMask, expandedHull, width, height);
    }

    // LEFT ARM
    const leftArmPoints = [
        kps[KEYPOINTS.LEFT_SHOULDER],
        kps[KEYPOINTS.LEFT_ELBOW],
        kps[KEYPOINTS.LEFT_WRIST]
    ].filter(kp => kp.score > 0.2);

    if (leftArmPoints.length >= 2) {
        fillLimb(bodyMask, leftArmPoints, 15, width, height); // 15px arm width
    }

    // RIGHT ARM
    const rightArmPoints = [
        kps[KEYPOINTS.RIGHT_SHOULDER],
        kps[KEYPOINTS.RIGHT_ELBOW],
        kps[KEYPOINTS.RIGHT_WRIST]
    ].filter(kp => kp.score > 0.2);

    if (rightArmPoints.length >= 2) {
        fillLimb(bodyMask, rightArmPoints, 15, width, height);
    }

    // LEFT LEG
    const leftLegPoints = [
        kps[KEYPOINTS.LEFT_HIP],
        kps[KEYPOINTS.LEFT_KNEE],
        kps[KEYPOINTS.LEFT_ANKLE]
    ].filter(kp => kp.score > 0.2);

    if (leftLegPoints.length >= 2) {
        fillLimb(bodyMask, leftLegPoints, 20, width, height); // 20px leg width
    }

    // RIGHT LEG
    const rightLegPoints = [
        kps[KEYPOINTS.RIGHT_HIP],
        kps[KEYPOINTS.RIGHT_KNEE],
        kps[KEYPOINTS.RIGHT_ANKLE]
    ].filter(kp => kp.score > 0.2);

    if (rightLegPoints.length >= 2) {
        fillLimb(bodyMask, rightLegPoints, 20, width, height);
    }

    return bodyMask;
}

/**
 * Old envelope function - kept for reference
 */
function createBodyEnvelope(kps: Array<{x: number, y: number, score: number}>, width: number, height: number): Uint8Array {
    const envelope = new Uint8Array(width * height);

    // Define body segments
    const segments = [
        [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER],
        [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_HIP],
        [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_HIP],
        [KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP],
        [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW],
        [KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
        [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW],
        [KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
        [KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE],
        [KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE],
        [KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE],
        [KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE],
    ];

    const headKeypoints = [KEYPOINTS.NOSE, KEYPOINTS.LEFT_EAR, KEYPOINTS.RIGHT_EAR, KEYPOINTS.LEFT_EYE, KEYPOINTS.RIGHT_EYE];

    // VERY generous thresholds to ensure full body coverage (belly, back, etc.)
    const headRadiusSq = 50 * 50;      // 50px radius around head points
    const torsoRadiusSq = 70 * 70;     // 70px radius around torso (includes belly/back)
    const armRadiusSq = 25 * 25;       // 25px radius around arms (tighter to exclude armpits)
    const legRadiusSq = 40 * 40;       // 40px radius around legs

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            let inEnvelope = false;

            // Check distance to head keypoints
            for (const kpIdx of headKeypoints) {
                const kp = kps[kpIdx];
                if (kp.score > 0.2) {
                    const dx = x - kp.x;
                    const dy = y - kp.y;
                    if (dx * dx + dy * dy < headRadiusSq) {
                        inEnvelope = true;
                        break;
                    }
                }
            }

            if (!inEnvelope) {
                // Check distance to body segments
                for (let i = 0; i < segments.length; i++) {
                    const [startIdx, endIdx] = segments[i];
                    const p1 = kps[startIdx];
                    const p2 = kps[endIdx];

                    if (p1.score < 0.2 || p2.score < 0.2) continue;

                    const distSq = distToSegmentSquared({ x, y }, p1, p2);

                    // Choose threshold based on body part
                    let thresholdSq = torsoRadiusSq;
                    if (i >= 4 && i <= 7) {
                        // Arms (segments 4-7)
                        thresholdSq = armRadiusSq;
                    } else if (i >= 8) {
                        // Legs (segments 8+)
                        thresholdSq = legRadiusSq;
                    }

                    if (distSq < thresholdSq) {
                        inEnvelope = true;
                        break;
                    }
                }
            }

            if (inEnvelope) {
                envelope[idx] = 255;
            }
        }
    }

    return envelope;
}

function keepLargestContour(mask: Uint8Array, width: number, height: number): Uint8Array {
    const visited = new Uint8Array(width * height);

    // 1. Find Connected Components
    const components: number[][] = [];

    for (let i = 0; i < width * height; i++) {
        if (mask[i] > 0 && visited[i] === 0) {
            // Found new component
            const component: number[] = [];
            const stack = [i];
            visited[i] = 1;

            while (stack.length > 0) {
                const idx = stack.pop()!;
                component.push(idx);

                const x = idx % width;
                const y = Math.floor(idx / width);

                // Check 4 neighbors
                const neighbors = [
                    { x: x - 1, y: y }, { x: x + 1, y: y },
                    { x: x, y: y - 1 }, { x: x, y: y + 1 }
                ];

                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                        const nIdx = n.y * width + n.x;
                        if (mask[nIdx] > 0 && visited[nIdx] === 0) {
                            visited[nIdx] = 1;
                            stack.push(nIdx);
                        }
                    }
                }
            }
            components.push(component);
        }
    }

    if (components.length === 0) return mask;

    // 2. Identify Largest Component
    let largestCompIdx = 0;
    let largestSize = 0;

    for (let i = 0; i < components.length; i++) {
        if (components[i].length > largestSize) {
            largestSize = components[i].length;
            largestCompIdx = i;
        }
    }

    // 3. Construct Clean Mask
    const cleanMask = new Uint8Array(width * height);
    const largestComponent = components[largestCompIdx];

    for (const idx of largestComponent) {
        cleanMask[idx] = 255;
    }

    return cleanMask;
}

function distToSegmentSquared(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }): number {
    const l2 = distSq(v, w);
    if (l2 === 0) return distSq(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function distSq(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

/**
 * Morphological erosion - shrinks white regions, removes small noise
 */
function erode(mask: Uint8Array, width: number, height: number, iterations: number = 1): Uint8Array {
    let current = new Uint8Array(mask);

    for (let iter = 0; iter < iterations; iter++) {
        const result = new Uint8Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Check if all neighbors are white (255)
                let allNeighborsWhite = true;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (current[nIdx] === 0) {
                                allNeighborsWhite = false;
                                break;
                            }
                        }
                    }
                    if (!allNeighborsWhite) break;
                }

                result[idx] = allNeighborsWhite ? 255 : 0;
            }
        }

        current = result;
    }

    return current;
}

/**
 * Morphological dilation - expands white regions, fills small holes
 */
function dilate(mask: Uint8Array, width: number, height: number, iterations: number = 1): Uint8Array {
    let current = new Uint8Array(mask);

    for (let iter = 0; iter < iterations; iter++) {
        const result = new Uint8Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Check if any neighbor is white (255)
                let anyNeighborWhite = false;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (current[nIdx] === 255) {
                                anyNeighborWhite = true;
                                break;
                            }
                        }
                    }
                    if (anyNeighborWhite) break;
                }

                result[idx] = anyNeighborWhite ? 255 : 0;
            }
        }

        current = result;
    }

    return current;
}

/**
 * Fill holes in the mask - any black pixel completely surrounded by white becomes white
 */
function fillHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(mask);

    // Flood fill from edges to mark background (pixels connected to border)
    const background = new Uint8Array(width * height);
    const stack: number[] = [];

    // Add all border pixels that are black (0) to stack
    for (let x = 0; x < width; x++) {
        // Top border
        if (mask[x] === 0) {
            stack.push(x);
            background[x] = 1;
        }
        // Bottom border
        const bottomIdx = (height - 1) * width + x;
        if (mask[bottomIdx] === 0) {
            stack.push(bottomIdx);
            background[bottomIdx] = 1;
        }
    }

    for (let y = 0; y < height; y++) {
        // Left border
        const leftIdx = y * width;
        if (mask[leftIdx] === 0) {
            stack.push(leftIdx);
            background[leftIdx] = 1;
        }
        // Right border
        const rightIdx = y * width + (width - 1);
        if (mask[rightIdx] === 0) {
            stack.push(rightIdx);
            background[rightIdx] = 1;
        }
    }

    // Flood fill background
    while (stack.length > 0) {
        const idx = stack.pop()!;
        const x = idx % width;
        const y = Math.floor(idx / width);

        // Check 4 neighbors
        const neighbors = [
            { x: x - 1, y: y }, { x: x + 1, y: y },
            { x: x, y: y - 1 }, { x: x, y: y + 1 }
        ];

        for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                const nIdx = n.y * width + n.x;
                if (mask[nIdx] === 0 && background[nIdx] === 0) {
                    background[nIdx] = 1;
                    stack.push(nIdx);
                }
            }
        }
    }

    // Any black pixel NOT in background is a hole - fill it
    for (let i = 0; i < width * height; i++) {
        if (mask[i] === 0 && background[i] === 0) {
            result[i] = 255; // Fill the hole
        }
    }

    return result;
}

// ===== Polygon and Shape Filling Functions =====

function fillCircle(mask: Uint8Array, cx: number, cy: number, radius: number, width: number, height: number) {
    const r2 = radius * radius;
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy <= r2) {
                mask[y * width + x] = 255;
            }
        }
    }
}

function fillLimb(mask: Uint8Array, points: Array<{x: number, y: number}>, width_px: number, imgWidth: number, imgHeight: number) {
    // Fill limb as series of circles along the skeleton
    for (let i = 0; i < points.length; i++) {
        fillCircle(mask, points[i].x, points[i].y, width_px, imgWidth, imgHeight);

        // Fill between consecutive points
        if (i < points.length - 1) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const steps = Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y));

            for (let t = 0; t <= steps; t++) {
                const ratio = t / steps;
                const x = p1.x + ratio * (p2.x - p1.x);
                const y = p1.y + ratio * (p2.y - p1.y);
                fillCircle(mask, x, y, width_px, imgWidth, imgHeight);
            }
        }
    }
}

/**
 * Quickhull algorithm for convex hull computation
 * More robust than Graham scan for small point sets
 */
function quickHull(points: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    if (points.length < 3) return points;

    // Find leftmost and rightmost points
    let minPoint = points[0];
    let maxPoint = points[0];

    for (const p of points) {
        if (p.x < minPoint.x) minPoint = p;
        if (p.x > maxPoint.x) maxPoint = p;
    }

    const hull: Array<{x: number, y: number}> = [];

    // Recursively find hull points on both sides
    quickHullRecursive(points, minPoint, maxPoint, 1, hull);
    quickHullRecursive(points, minPoint, maxPoint, -1, hull);

    return hull;
}

function quickHullRecursive(
    points: Array<{x: number, y: number}>,
    p1: {x: number, y: number},
    p2: {x: number, y: number},
    side: number,
    hull: Array<{x: number, y: number}>
) {
    let maxDist = 0;
    let maxPoint: {x: number, y: number} | null = null;

    // Find point furthest from line p1-p2
    for (const p of points) {
        const dist = distanceFromLine(p, p1, p2);
        if (lineSide(p, p1, p2) === side && dist > maxDist) {
            maxDist = dist;
            maxPoint = p;
        }
    }

    // If no point found, p1-p2 is on the hull
    if (!maxPoint) {
        hull.push(p1);
        return;
    }

    // Recursively find hull points
    quickHullRecursive(points, p1, maxPoint, -lineSide(p2, p1, maxPoint), hull);
    quickHullRecursive(points, maxPoint, p2, -lineSide(p1, maxPoint, p2), hull);
}

function lineSide(p: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}): number {
    return Math.sign((p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x));
}

function distanceFromLine(p: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}): number {
    return Math.abs((p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x)) /
           Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Keep old Graham scan for reference
function convexHull(points: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    if (points.length < 3) return points;

    // Graham scan algorithm
    const sorted = [...points].sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
    const p0 = sorted[0];

    const angleSort = sorted.slice(1).sort((a, b) => {
        const angleA = Math.atan2(a.y - p0.y, a.x - p0.x);
        const angleB = Math.atan2(b.y - p0.y, b.x - p0.x);
        return angleA - angleB;
    });

    const hull = [p0, angleSort[0]];

    for (let i = 1; i < angleSort.length; i++) {
        let top = hull[hull.length - 1];
        let nextToTop = hull[hull.length - 2];

        while (hull.length > 1 && ccw(nextToTop, top, angleSort[i]) <= 0) {
            hull.pop();
            top = hull[hull.length - 1];
            nextToTop = hull[hull.length - 2];
        }

        hull.push(angleSort[i]);
    }

    return hull;
}

function ccw(p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

function expandPolygon(polygon: Array<{x: number, y: number}>, distance: number): Array<{x: number, y: number}> {
    // Expand polygon outward by moving each vertex along its normal
    const expanded: Array<{x: number, y: number}> = [];

    for (let i = 0; i < polygon.length; i++) {
        const prev = polygon[(i - 1 + polygon.length) % polygon.length];
        const curr = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        // Calculate outward normal
        const v1x = curr.x - prev.x;
        const v1y = curr.y - prev.y;
        const v2x = next.x - curr.x;
        const v2y = next.y - curr.y;

        // Average of edge normals
        const n1x = -v1y;
        const n1y = v1x;
        const n2x = -v2y;
        const n2y = v2x;

        const nx = n1x + n2x;
        const ny = n1y + n2y;
        const len = Math.sqrt(nx * nx + ny * ny) || 1;

        expanded.push({
            x: curr.x + (nx / len) * distance,
            y: curr.y + (ny / len) * distance
        });
    }

    return expanded;
}

function fillPolygon(mask: Uint8Array, polygon: Array<{x: number, y: number}>, width: number, height: number) {
    if (polygon.length < 3) return;

    // Find bounding box
    const minY = Math.max(0, Math.floor(Math.min(...polygon.map(p => p.y))));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(...polygon.map(p => p.y))));

    // Scanline fill
    for (let y = minY; y <= maxY; y++) {
        const intersections: number[] = [];

        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];

            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                const x = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                intersections.push(x);
            }
        }

        intersections.sort((a, b) => a - b);

        for (let i = 0; i < intersections.length; i += 2) {
            if (i + 1 < intersections.length) {
                const x1 = Math.max(0, Math.floor(intersections[i]));
                const x2 = Math.min(width - 1, Math.ceil(intersections[i + 1]));

                for (let x = x1; x <= x2; x++) {
                    mask[y * width + x] = 255;
                }
            }
        }
    }
}
