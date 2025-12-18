import React, { useRef, useEffect, useState } from 'react';
import type { Point } from '../lib/math';
import { detectRoom } from '../lib/vision';

interface CanvasLayerProps {
    image: string | null;
    activeTool: string;
    onPointsChange: (points: Point[]) => void;
    onCalibrationEnd?: (p1: Point, p2: Point) => void;
    scale: number; // Viewport scale (zoom)
    offset: { x: number; y: number }; // Viewport offset (pan)
}

export function CanvasLayer({ image, activeTool, onPointsChange, onCalibrationEnd, scale, offset }: CanvasLayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [localPoints, setLocalPoints] = useState<Point[]>([]);
    const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);

            // Draw Image or Grid
            if (image) {
                const img = new Image();
                img.src = image;
                if (img.complete) {
                    ctx.drawImage(img, 0, 0);
                } else {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0);
                    }
                }
            } else {
                // Draw Grid
                ctx.strokeStyle = '#1e293b'; // slate-800
                ctx.lineWidth = 1 / scale;
                const gridSize = 50;
                const steps = 40;
                ctx.beginPath();
                for (let i = -steps; i <= steps; i++) {
                    ctx.moveTo(i * gridSize, -steps * gridSize);
                    ctx.lineTo(i * gridSize, steps * gridSize);
                    ctx.moveTo(-steps * gridSize, i * gridSize);
                    ctx.lineTo(steps * gridSize, i * gridSize);
                }
                ctx.stroke();
            }

            // Draw Points/Polygons (Standard)
            if (localPoints.length > 0) {
                ctx.beginPath();
                ctx.moveTo(localPoints[0].x, localPoints[0].y);
                for (let i = 1; i < localPoints.length; i++) {
                    ctx.lineTo(localPoints[i].x, localPoints[i].y);
                }
                if (localPoints.length > 2) ctx.closePath();

                ctx.strokeStyle = '#0ea5e9'; // sky-500
                ctx.lineWidth = 2 / scale;
                ctx.stroke();

                ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
                ctx.fill();

                // Draw vertices
                ctx.fillStyle = '#fff';
                localPoints.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });
            }

            // Draw Calibration Points
            if (activeTool === 'calibrate' && calibrationPoints.length > 0) {
                ctx.beginPath();
                ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
                for (let i = 1; i < calibrationPoints.length; i++) {
                    ctx.lineTo(calibrationPoints[i].x, calibrationPoints[i].y);
                }
                ctx.strokeStyle = '#f59e0b'; // amber-500
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([5 / scale, 5 / scale]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw vertices
                ctx.fillStyle = '#f59e0b';
                calibrationPoints.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            ctx.restore();
        };

        draw();
    }, [image, scale, offset, localPoints, calibrationPoints, activeTool]);

    // Reset calibration points when tool changes
    useEffect(() => {
        if (activeTool !== 'calibrate') {
            setCalibrationPoints([]);
        }
    }, [activeTool]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canvasRef.current) return;

        // Calculate world coordinates
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        if (activeTool === 'draw') {
            const newPoints = [...localPoints, { x, y }];
            setLocalPoints(newPoints);
            onPointsChange(newPoints);
        } else if (activeTool === 'calibrate') {
            const newPts = [...calibrationPoints, { x, y }];
            setCalibrationPoints(newPts);

            if (newPts.length === 2) {
                // Determine completion
                if (onCalibrationEnd) {
                    onCalibrationEnd(newPts[0], newPts[1]);
                }
                // Reset after short delay or immediately?
                // Let's keep them visible until user acts, but simplest is reset
                setCalibrationPoints([]);
            }
        } else if (activeTool === 'magic') {
            // Run detection
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const tempCanvas = document.createElement('canvas');
                const img = new Image();
                if (image) {
                    img.src = image;
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    const tCtx = tempCanvas.getContext('2d');
                    if (tCtx) {
                        tCtx.drawImage(img, 0, 0);
                        const detected = detectRoom(tCtx, Math.floor(x), Math.floor(y), img.width, img.height);
                        if (detected.length > 0) {
                            setLocalPoints(detected);
                            onPointsChange(detected);
                        }
                    }
                }
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            className={
                activeTool === 'select' ? 'cursor-default' :
                    activeTool === 'pan' ? 'cursor-grab' :
                        'cursor-crosshair'
            }
            width={1920}
            height={1080}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
