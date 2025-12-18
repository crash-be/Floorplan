import { AreaChart, Ruler, Calculator } from 'lucide-react';

interface SidebarProps {
    area: number;
}

export function Sidebar({ area }: SidebarProps) {
    return (
        <div className="absolute right-6 top-6 bottom-6 w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl flex flex-col pointer-events-auto">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-light text-slate-100 flex items-center gap-2">
                    <Calculator size={20} className="text-blue-400" />
                    Calculations
                </h2>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <AreaChart size={18} className="text-emerald-400" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Total Area</span>
                    </div>
                    <div className="text-3xl font-light text-white">
                        {area.toFixed(2)} <span className="text-lg text-slate-500">m²</span>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 opacity-60">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Ruler size={18} className="text-blue-400" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Perimeter</span>
                    </div>
                    <div className="text-3xl font-light text-white">
                        -- <span className="text-lg text-slate-500">m</span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl">
                    <h3 className="text-blue-200 font-medium mb-2 text-sm">How to use</h3>
                    <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                        <li>Use <strong>Calibrate</strong> to set the scale (e.g. click two points of a known door width).</li>
                        <li>Use <strong>Auto</strong> to click inside a room to detect walls.</li>
                        <li>Use <strong>Draw</strong> to manually trace a room.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
