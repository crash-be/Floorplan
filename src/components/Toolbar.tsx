import { MousePointer2, Ruler, PenTool, Wand2, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

export type Tool = 'select' | 'calibrate' | 'draw' | 'magic';

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    onReset: () => void;
}

export function Toolbar({ activeTool, onToolChange, onReset }: ToolbarProps) {
    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'calibrate', icon: Ruler, label: 'Calibrate' }, // Lucide icon name case-sensitive? 'ruler' is lower case in Lucide usually? Wait, component names are PascalCase. It's 'Ruler'. I'll fix the import.
        { id: 'draw', icon: PenTool, label: 'Draw' },
        { id: 'magic', icon: Wand2, label: 'Auto' },
    ] as const;

    return (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-700 shadow-xl z-20">
            {tools.map((item) => {
                const Icon = item.icon;
                const isActive = activeTool === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onToolChange(item.id as Tool)}
                        className={clsx(
                            "p-3 rounded-xl transition-all relative group",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                        title={item.label}
                    >
                        <Icon size={20} />

                        {/* Tooltip */}
                        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
                            {item.label}
                        </span>
                    </button>
                );
            })}

            <div className="h-px w-full bg-slate-700 my-1" />

            <button
                onClick={onReset}
                className="p-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl transition-colors"
                title="Reset All"
            >
                <RefreshCcw size={20} />
            </button>
        </div>
    );
}
