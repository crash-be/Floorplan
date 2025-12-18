import { type Point, distance } from './math';

/**
 * Simulates detecting walls/rooms from an image.
 * Uses robust flood-fill based room detector and contour tracing.
 */

/**
 * Analyzes the image data to find a closed shape surrounding a click point.
 * Uses a Flood Fill algorithm to find the boundary, then traces the contour.
 */
export function detectRoom(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number,
    height: number
): Point[] {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Helper to get pixel brightness
    const getBrightness = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        const offset = (y * width + x) * 4;
        return (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
    };

    const startBrightness = getBrightness(startX, startY);
    const threshold = 40; // Slightly stricter threshold

    const isMatch = (x: number, y: number) => {
        return Math.abs(getBrightness(x, y) - startBrightness) < threshold;
    };

    // 1. Flood Fill to find the Region
    // We'll use a 1D array for visited to be faster: index = y * width + x
    const visited = new Uint8Array(width * height);
    const queue: number[] = [startX, startY];

    // Mark start
    visited[startY * width + startX] = 1;

    let minX = width, maxX = 0, minY = height, maxY = 0;

    // We will build a 'mask' of the room.
    // Instead of full image implementation, let's keep it simple: 
    // We just mark 'visited'.
    // Then we act as if 'visited' pixels are the foreground.

    let head = 0;
    while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];

        // Track bounds for optimization (not strictly needed but good practice)
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
            cx + 1, cy,
            cx - 1, cy,
            cx, cy + 1,
            cx, cy - 1
        ];

        for (let i = 0; i < neighbors.length; i += 2) {
            const nx = neighbors[i];
            const ny = neighbors[i + 1];

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = ny * width + nx;
                if (visited[idx] === 0) {
                    if (isMatch(nx, ny)) {
                        visited[idx] = 1; // It's part of the room
                        queue.push(nx, ny);
                    } else {
                        visited[idx] = 2; // It's a boundary/wall
                    }
                }
            }
        }
    }

    // 2. Contour Tracing (Moore-Neighbor Tracing)
    // Find a starting boundary pixel
    let startBoundary: Point | null = null;

    // Scan from top-left of bounds
    outer: for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const idx = y * width + x;
            // If we found a room pixel, and its neighbor is NOT a room pixel, we found an edge?
            // Actually, we want to trace the *outer* edge of the '1's.
            if (visited[idx] === 1) {
                // Check if it's on the edge (neighbor is 0 or 2 or out of bounds)
                if (x === 0 || visited[idx - 1] !== 1) {
                    startBoundary = { x, y };
                    break outer;
                }
            }
        }
    }

    if (!startBoundary) return [];

    const contour = traceContour(visited, width, height, startBoundary.x, startBoundary.y);

    // 3. Simplify Polygon (Ramer-Douglas-Peucker)
    // Reduce the jagged pixel edges to clean lines
    const tolerance = 15.0; // Aggressive smoothing to remove noise
    const simplified = simplifyPolygon(contour, tolerance);

    return simplified;
}

function traceContour(grid: Uint8Array, width: number, height: number, startX: number, startY: number): Point[] {
    const contour: Point[] = [];
    let x = startX;
    let y = startY;

    // Moore-Neighbor Tracing
    // Backtrack to enter from a non-object neighbor
    let from = 4; // Coming from LEFT (standard assumption for first pixel found by left-to-right scan)

    // Directions: 0:Right, 1:BR, 2:Bottom, 3:BL, 4:Left, 5:TL, 6:Top, 7:TR
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];

    contour.push({ x, y });

    // Safety brake
    let steps = 0;
    const maxSteps = width * height;

    let sx = x;
    let sy = y;

    // We need to keep going until we return to start AND move in the same initial direction
    // But simple loop closure check is usually enough given we just want a polygon.

    do {
        // Search 8 neighbors in clockwise order, starting from 'from' direction (backwards)
        // Actually Moore tracing starts checking from the pixel we entered *from*.

        let found = false;
        for (let i = 0; i < 8; i++) {
            // (from + i) % 8 ? 
            // Logic: We entered P from neighbor B. We start checking neighbors of P starting at B, clockwise.
            // The first '1' we find is the next boundary pixel.
            // 'from' is the direction index OF THE PREVIOUS pixel relative to CURRENT.
            // So if we came from LEFT (index 4), the neighbor is at index 4.

            // Wait, standard implementation:
            // Start searching at backtrack index.
            const checkDir = (from + 1 + i) % 8; // Start clockwise from 'entered' (backtrack) position? 
            // Moore tracing usually starts checking from the previous white pixel.

            const nx = x + dx[checkDir];
            const ny = y + dy[checkDir];

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny * width + nx] === 1) {
                    // Found next pixel
                    contour.push({ x: nx, y: ny });
                    x = nx;
                    y = ny;
                    // New 'from' is the opposite of the direction we just moved
                    // We moved checkDir. So we came from checkDir + 4 (flipped).
                    // But for the algorithm next step, we want the direction vector index pointing TO the neighbor we just came from.
                    // Which is (checkDir + 4) % 8.
                    from = (checkDir + 4) % 8;
                    found = true;
                    break;
                }
            }
        }

        if (!found) break; // Isolated pixel?
        steps++;

    } while ((x !== sx || y !== sy) && steps < maxSteps);

    return contour;
}

// Ramer-Douglas-Peucker Algorithm
function simplifyPolygon(points: Point[], tolerance: number): Point[] {
    if (points.length < 3) return points;

    let maxDist = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
        const d = perpendicularDistance(points[i], points[0], points[end]);
        if (d > maxDist) {
            maxDist = d;
            index = i;
        }
    }

    if (maxDist > tolerance) {
        const left = simplifyPolygon(points.slice(0, index + 1), tolerance);
        const right = simplifyPolygon(points.slice(index), tolerance);
        return left.slice(0, left.length - 1).concat(right);
    } else {
        return [points[0], points[end]];
    }
}

function perpendicularDistance(p: Point, lineStart: Point, lineEnd: Point): number {
    let area = Math.abs(
        0.5 * (lineStart.x * lineEnd.y + lineEnd.x * p.y + p.x * lineStart.y - lineEnd.x * lineStart.y - p.x * lineEnd.y - lineStart.x * p.y)
    );
    let bottom = Math.sqrt(Math.pow(lineStart.x - lineEnd.x, 2) + Math.pow(lineStart.y - lineEnd.y, 2));
    if (bottom === 0) return distance(p, lineStart);
    return (area * 2) / bottom;
}
