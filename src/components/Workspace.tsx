import React, { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { CanvasLayer } from './CanvasLayer';
import { MeasurementsLayer } from './MeasurementsLayer';
import { analyzeWithGrok } from '../services/grok';
import { generateQuotePDF } from '../lib/pdf';
import { resizeSegment } from '../lib/math';
import type { Point } from '../lib/math';
import { X, ChevronRight } from 'lucide-react';

const GRASS_OPTIONS = [
    { name: 'Royal Grass Bliss', price: 49.95 },
    { name: 'Royal Grass Bloom', price: 46.95 },
    { name: 'Royal Grass Oscura', price: 46.95 },
    { name: 'Royal Grass Blossom', price: 46.95 },
    { name: 'Royal Grass Zafira', price: 40.95 },
    { name: 'Royal Grass Wave', price: 39.95 },
    { name: 'Royal Grass Aura', price: 41.95 },
];

interface WorkspaceProps {
    image: string | null;
}

export const Workspace: React.FC<WorkspaceProps> = ({ image }) => {
    const [points, setPoints] = useState<Point[]>([]);
    const [activeTool, setActiveTool] = useState<'select' | 'calibrate'>('select');
    const [scale, setScale] = useState(0.5); // Zoom level
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const targetRef = useRef<HTMLDivElement>(null);
    const [calibrationScale, setCalibrationScale] = useState(1); // Meters per Pixel
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGrass, setSelectedGrass] = useState(GRASS_OPTIONS[0].name);

    // Zoom Handling
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                setScale(s => Math.min(Math.max(0.1, s * delta), 5));
            }
        };
        const ref = targetRef.current;
        if (ref) {
            ref.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (ref) ref.removeEventListener('wheel', handleWheel);
        };
    }, []);

    useGesture(
        {
            onDrag: ({ offset: [dx, dy] }) => {
                if (activeTool === 'select') {
                    setOffset({ x: dx, y: dy });
                }
            },
            onWheel: ({ event, ctrlKey }) => {
                if (!ctrlKey) { // Only pan if Ctrl is not pressed (zoom is handled by useEffect)
                    setOffset(prev => ({ x: prev.x - event.deltaX, y: prev.y - event.deltaY }));
                }
            }
        },
        {
            target: targetRef,
            drag: {
                from: () => [offset.x, offset.y],
                enabled: activeTool === 'select',
            },
        }
    );

    // Simple zoom handlers
    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));

    const handlePointsChange = (newPoints: Point[]) => {
        setPoints(newPoints);
    };



    return (
        <div ref={targetRef} className="w-full h-full relative overflow-hidden bg-slate-900/50 touch-none">
            <CanvasLayer
                image={image}
                activeTool={activeTool}
                onPointsChange={handlePointsChange}
                onCalibrationEnd={(p1, p2) => {
                    const pixels = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    if (pixels === 0) return;

                    const input = window.prompt("Enter the length of this line in meters:", "1.0");
                    if (input) {
                        const meters = parseFloat(input);
                        if (!isNaN(meters) && meters > 0) {
                            const newScale = meters / pixels;
                            setCalibrationScale(newScale);
                            alert(`Scale Calibrated! 1 pixel = ${newScale.toFixed(4)} meters.`);
                            setActiveTool('select'); // Switch back to select
                        } else {
                            alert("Invalid length entered.");
                        }
                    }
                }}
                scale={scale}
                offset={offset}
            />

            <MeasurementsLayer
                points={points}
                scale={scale}
                offset={offset}
                calibrationScale={calibrationScale}
                onLengthChange={(index, newLengthMeters) => {
                    if (activeTool === 'calibrate') {
                        const p1 = points[index];
                        const p2 = points[index + 1];
                        const currentDistPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                        if (currentDistPx > 0) {
                            const newScale = newLengthMeters / currentDistPx;
                            setCalibrationScale(newScale);
                            alert(`Scale Calibrated! 1 pixel = ${newScale.toFixed(4)} meters.`);
                            setActiveTool('select');
                        }
                    } else {
                        const targetPixels = newLengthMeters / calibrationScale;
                        const newPoints = resizeSegment(points, index, targetPixels);
                        setPoints(newPoints);
                    }
                }}
            />

            {/* Analysis & Results UI */}
            {image && (
                <div
                    className="absolute top-4 left-4 z-30 flex gap-2 items-center"
                    onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                    onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                >
                    <button
                        onClick={async () => {
                            if (!image) return;
                            setIsAnalyzing(true);
                            setAnalysisResult(null);
                            try {
                                const resultStr = await analyzeWithGrok(image);
                                let jsonStr = "";
                                const match = resultStr.match(/\{[\s\S]*\}/);

                                if (match) {
                                    jsonStr = match[0];
                                }

                                try {
                                    const parsed = JSON.parse(jsonStr);
                                    setAnalysisResult(parsed);
                                } catch (parseError) {
                                    console.warn("JSON Parse Failed, attempting cleanup:", parseError);
                                    const clean = resultStr
                                        .replace(/^[\s\S]*?```json/i, "")
                                        .replace(/^[\s\S]*?'''json/i, "")
                                        .replace(/```\s*$/i, "")
                                        .replace(/'''\s*$/i, "")
                                        .trim();

                                    const cleanMatch = clean.match(/\{[\s\S]*\}/);
                                    const finalJson = cleanMatch ? cleanMatch[0] : clean;

                                    try {
                                        setAnalysisResult(JSON.parse(finalJson));
                                    } catch (e2) {
                                        console.error("Final JSON parse failed:", e2);
                                        const areaMatch = resultStr.match(/"estimatedArea":\s*"([^"]+)"/);
                                        const areaVal = areaMatch ? areaMatch[1] : "Onbekend";

                                        setAnalysisResult({
                                            summary: "Kon de resultaten niet volledig verwerken. Zie hieronder de ruwe output.",
                                            measurements: [],
                                            estimatedArea: areaVal,
                                            rawText: resultStr
                                        });
                                    }
                                }
                            } catch (e: any) {
                                console.error(e);
                                alert(`Analysis failed: ${e.message || "Unknown error"} `);
                            } finally {
                                setIsAnalyzing(false);
                            }
                        }}
                        disabled={isAnalyzing}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors flex items-center gap-2"
                    >
                        {isAnalyzing ? "Analyseren..." : "Analiseer"}
                    </button>
                    {analysisResult && (
                        <div className="absolute top-12 left-0 bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-slate-700 shadow-2xl w-96 text-sm text-slate-200 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white">Vision AI Analyse</h3>
                                <button onClick={() => setAnalysisResult(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            {analysisResult.estimatedArea && (
                                <div className="mb-2">
                                    <span className="text-slate-400">Oppervlakte:</span> <span className="text-green-400 font-mono">{analysisResult.estimatedArea}</span>
                                </div>
                            )}

                            {analysisResult.measurements && analysisResult.measurements.length > 0 && (
                                <div className="mb-2">
                                    <div className="text-slate-400 mb-1">Herkende maten op het plan:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {analysisResult.measurements.map((m: string, i: number) => (
                                            <span key={i} className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-xs text-blue-300 font-mono">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysisResult.summary ? (
                                <p className="text-xs text-slate-400 mt-2 border-t border-slate-800 pt-2 whitespace-pre-wrap">
                                    {analysisResult.summary}
                                </p>
                            ) : (
                                analysisResult.rawText && (
                                    <p className="text-xs text-slate-500 mt-2 border-t border-slate-800 pt-2 whitespace-pre-wrap font-mono">
                                        {analysisResult.rawText}
                                    </p>
                                )
                            )}

                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-between group"
                            >
                                <span>Maak offerte</span>
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Zoom Controls Overlay */}
            <div
                className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-20"
                onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            >
                <button onClick={handleZoomOut} className="w-10 h-10 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700">-</button>
                <div className="flex items-center justify-center w-16 bg-slate-800/80 text-xs text-slate-300 border border-slate-700 rounded-lg">
                    {Math.round(scale * 100)}%
                </div>
                <button onClick={handleZoomIn} className="w-10 h-10 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700">+</button>
            </div>

            {/* Quote Sidebar */}
            {isSidebarOpen && (
                <div
                    className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 shadow-2xl z-40 transform transition-transform animate-in slide-in-from-right duration-300"
                    onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                    onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-light text-white">Offerte</h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Selecteer Kunstgras</label>
                            <div className="relative">
                                <select
                                    value={selectedGrass}
                                    onChange={(e) => setSelectedGrass(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    {GRASS_OPTIONS.map((grass) => (
                                        <option key={grass.name} value={grass.name}>
                                            {grass.name} - € {grass.price.toFixed(2).replace('.', ',')}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    ▼
                                </div>
                            </div>
                        </div>

                        {analysisResult?.estimatedArea && (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Oppervlakte</span>
                                    <span className="text-white">{analysisResult.estimatedArea}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Type</span>
                                    <span className="text-white text-right w-32 truncate">{selectedGrass}</span>
                                </div>
                                <div className="border-t border-slate-700/50 my-2 pt-2 flex justify-between font-medium">
                                    <span className="text-slate-300">Prijs indicatie</span>
                                    {(() => {
                                        const areaVal = parseFloat(analysisResult.estimatedArea.replace(',', '.').replace(/[^\d.]/g, ''));
                                        const grassPrice = GRASS_OPTIONS.find(g => g.name === selectedGrass)?.price || 0;
                                        if (!isNaN(areaVal)) {
                                            return <span className="text-green-400">€ {(areaVal * grassPrice).toFixed(2).replace('.', ',')}</span>;
                                        }
                                        return <span className="text-slate-500">-</span>;
                                    })()}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (analysisResult?.estimatedArea) {
                                    const areaVal = parseFloat(analysisResult.estimatedArea.replace(',', '.').replace(/[^\d.]/g, ''));
                                    const grass = GRASS_OPTIONS.find(g => g.name === selectedGrass);
                                    if (!isNaN(areaVal) && grass && image) {
                                        generateQuotePDF(image, areaVal, grass.name, grass.price);
                                    } else {
                                        alert("Kan offerte niet genereren: gegevens ontbreken.");
                                    }
                                }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all mt-4 flex items-center justify-center gap-2"
                        >
                            <span>Genereer offerte</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
