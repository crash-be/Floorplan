import React, { useState } from 'react';
import { type Point, distance, midpoint } from '../lib/math';

interface MeasurementsLayerProps {
    points: Point[];
    scale: number;
    offset: { x: number; y: number };
    calibrationScale: number; // meters per pixel
    onLengthChange: (segmentIndex: number, newLengthMeters: number) => void;
}

export function MeasurementsLayer({ points, scale, offset, calibrationScale, onLengthChange }: MeasurementsLayerProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    if (points.length < 2) return null;

    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        segments.push({ p1: points[i], p2: points[i + 1], index: i });
    }
    // Close the loop if needed? 
    // If it's a polygon tool, we usually close it. 
    // Assuming for now it's an open chain until explicit close, but let's just handle open chain segments.

    const handleLabelClick = (index: number, currentLength: number) => {
        setEditingIndex(index);
        setEditValue(currentLength.toFixed(2));
    };

    const handleInputBlur = () => {
        finishEdit();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            finishEdit();
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
        }
    };

    const finishEdit = () => {
        if (editingIndex !== null) {
            const val = parseFloat(editValue);
            if (!isNaN(val) && val > 0) {
                onLengthChange(editingIndex, val);
            }
            setEditingIndex(null);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {segments.map((seg) => {
                const mid = midpoint(seg.p1, seg.p2);
                const screenX = mid.x * scale + offset.x;
                const screenY = mid.y * scale + offset.y;

                // Length in pixels
                const distPx = distance(seg.p1, seg.p2);
                // Length in meters
                const distM = distPx * calibrationScale; // meters = pixels * (meters/pixel)

                const isEditing = editingIndex === seg.index;

                return (
                    <div
                        key={seg.index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                        style={{ left: screenX, top: screenY }}
                    >
                        {isEditing ? (
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                className="w-20 px-1 py-0.5 text-xs bg-white text-black rounded border border-blue-500 shadow-lg outline-none max-w-[80px]"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLabelClick(seg.index, distM);
                                }}
                                className="bg-slate-800/80 hover:bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm border border-slate-600 shadow-sm transition-colors cursor-pointer select-none"
                            >
                                {distM.toFixed(2)}m
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
