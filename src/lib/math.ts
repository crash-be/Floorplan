export type Point = { x: number; y: number };

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * @param points Array of objects with x and y coordinates
 * @param scale The ratio of real-world meters per pixel (1 meter = X pixels ? No, usually metersPerPixel. 
 * Wait, existing code said "calibrationScale: Meters per pixel". So Area_m = Area_px * scale^2.
 * If scale is 0.01 meters/pixel, then 100px = 1m. Area 10000px^2 = 1m^2.
 * Correct.
 * @returns Area in square meters
 */
export function calculatePolygonArea(points: Point[], scale: number = 1): number {
    if (points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }

    area = Math.abs(area) / 2;

    // Convert pixel area to square meters: Area_m2 = Area_px2 * (m/px)^2
    return area * (scale * scale);
}

/**
 * Calculates the distance between two points.
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculates the scale (meters per pixel) given a pixel distance and a known real-world length in meters.
 */
export function calculateScale(pixelDistance: number, realLengthMeters: number): number {
    if (pixelDistance === 0) return 0;
    return realLengthMeters / pixelDistance;
}

/**
 * Returns the midpoint of a segment.
 */
export function midpoint(p1: Point, p2: Point): Point {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/**
 * Adjusts a polygon by changing the length of one segment (pIndex -> pIndex+1).
 * It moves pIndex+1 and ALL subsequent points by the delta vector.
 * This preserves the angles and lengths of the subsequent chain.
 */
export function resizeSegment(points: Point[], pIndex: number, newLengthPixels: number): Point[] {
    if (pIndex < 0 || pIndex >= points.length - 1) return points;

    const p1 = points[pIndex];
    const p2 = points[pIndex + 1];

    const currentDist = distance(p1, p2);
    if (currentDist === 0) return points;

    const ratio = newLengthPixels / currentDist;

    // Vector p1 -> p2
    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;

    // New vector p1 -> newP2
    const newVx = vx * ratio;
    const newVy = vy * ratio;

    // Delta movement for p2
    const dx = newVx - vx;
    const dy = newVy - vy;

    // Move p2 and all subsequent points
    return points.map((p, i) => {
        if (i > pIndex) {
            return { x: p.x + dx, y: p.y + dy };
        }
        return p;
    });
}
