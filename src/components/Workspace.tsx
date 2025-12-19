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
    const [scale, setScale] = useState(0.5);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const targetRef = useRef<HTMLDivElement>(null);
    const [calibrationScale, setCalibrationScale] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGrass, setSelectedGrass] = useState(GRASS_OPTIONS[0].name);

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
                if (!ctrlKey) {
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

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));

    const handlePointsChange = (newPoints: Point[]) => {
        setPoints(newPoints);
    };

    // --- VERBETERDE ANALYSE LOGICA ---
    const startAnalysis = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const rawResponse = await analyzeWithGrok(image);

            // 1. Zoek naar JSON patroon in de tekst (voor het geval de AI extra tekst stuurt)
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("Geen geldige data ontvangen van de AI.");
            }

            // 2. Probeer de gevonden JSON te parsen
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                setAnalysisResult(parsed);
            } catch (e) {
                console.error("Parse error:", e);
                // Fallback: Als parse faalt, probeer handmatig de area te vinden
                const areaMatch = rawResponse.match(/(\d+[.,]\d+)\s*m²/);
                setAnalysisResult({
                    summary: rawResponse,
                    estimatedArea: areaMatch ? `${areaMatch[1]} m²` : "Zie uitleg",
                    measurements: []
                });
            }
        } catch (e: any) {
            console.error(e);
            alert(`Analyse mislukt: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
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

                    const input = window.prompt("Geef de lengte van deze lijn in meters:", "1.0");
                    if (input) {
                        const meters = parseFloat(input.replace(',', '.'));
                        if (!isNaN(meters) && meters > 0) {
                            const newScale = meters / pixels;
                            setCalibrationScale(newScale);
                            alert(`Schaal ingesteld: 1 pixel = ${newScale.toFixed(4)} meter.`);
                            setActiveTool('select');
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
                            setCalibrationScale(newLengthMeters / currentDistPx);
                            setActiveTool('select');
                        }
                    } else {
                        const targetPixels = newLengthMeters / calibrationScale;
                        setPoints(resizeSegment(points, index, targetPixels));
                    }
                }}
            />

            {/* Analysis UI */}
            <div className="absolute top-4 left-4 z-30 flex gap-2 items-center">
                <button
                    onClick={startAnalysis}
                    disabled={isAnalyzing || !image}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors flex items-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyseren...
                        </>
                    ) : (
                        "Analyseer Plan"
                    )}
                </button>

                {analysisResult && (
                    <div className="absolute top-12 left-0 bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl border border-slate-700 shadow-2xl w-96 text-sm text-slate-200 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-base">AI Resultaat</h3>
                            <button onClick={() => setAnalysisResult(null)} className="text-slate-400 hover:text-white p-1">✕</button>
                        </div>

                        {analysisResult.estimatedArea && (
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1">Berekende Oppervlakte</span>
                                <span className="text-2xl font-semibold text-blue-400">{analysisResult.estimatedArea}</span>
                            </div>
                        )}

                        {analysisResult.measurements?.length > 0 && (
                            <div className="mb-4">
                                <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Gevonden Maten</div>
                                <div className="flex flex-wrap gap-1">
                                    {analysisResult.measurements.map((m: string, i: number) => (
                                        <span key={i} className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-xs text-blue-300 font-mono">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-slate-300 border-t border-slate-800 pt-3 leading-relaxed">
                            {analysisResult.summary}
                        </div>

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-between group"
                        >
                            <span>Maak offerte</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-slate-900/80 backdrop-blur p-2 rounded-2xl border border-slate-700 shadow-xl">
                <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">-</button>
                <div className="flex items-center justify-center w-20 text-xs font-mono text-slate-300">
                    {Math.round(scale * 100)}%
                </div>
                <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">+</button>
            </div>

            {/* Quote Sidebar */}
            {isSidebarOpen && (
                <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 shadow-2xl z-40 animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-light text-white">Offerte</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3">Kunstgras Selectie</label>
                            <select
                                value={selectedGrass}
                                onChange={(e) => setSelectedGrass(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                {GRASS_OPTIONS.map((grass) => (
                                    <option key={grass.name} value={grass.name}>
                                        {grass.name} (€{grass.price.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {analysisResult?.estimatedArea && (
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                <div className="flex justify-between text-sm mb-2 text-slate-400">
                                    <span>Oppervlakte</span>
                                    <span className="text-white">{analysisResult.estimatedArea}</span>
                                </div>
                                <div className="border-t border-slate-700/50 my-3 pt-3 flex justify-between font-semibold">
                                    <span className="text-slate-300">Totaal (incl. BTW)</span>
                                    {(() => {
                                        const areaVal = parseFloat(analysisResult.estimatedArea.replace(',', '.').replace(/[^\d.]/g, ''));
                                        const grassPrice = GRASS_OPTIONS.find(g => g.name === selectedGrass)?.price || 0;
                                        return !isNaN(areaVal) ? (
                                            <span className="text-green-400 text-lg">€ {(areaVal * grassPrice).toFixed(2).replace('.', ',')}</span>
                                        ) : <span className="text-slate-500">-</span>;
                                    })()}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                const areaVal = parseFloat(analysisResult?.estimatedArea?.replace(',', '.').replace(/[^\d.]/g, '') || "0");
                                const grass = GRASS_OPTIONS.find(g => g.name === selectedGrass);
                                if (areaVal > 0 && grass && image) {
                                    generateQuotePDF(image, areaVal, grass.name, grass.price);
                                } else {
                                    alert("Kan offerte niet genereren: Ongeldige oppervlakte.");
                                }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-900/30 transition-all mt-4 flex items-center justify-center gap-2"
                        >
                            Genereer PDF Offerte
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}