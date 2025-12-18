import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadZoneProps {
    onImageSelected: (file: File) => void;
}

export function UploadZone({ onImageSelected }: UploadZoneProps) {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                onImageSelected(file);
            }
        },
        [onImageSelected]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                onImageSelected(e.target.files[0]);
            }
        },
        [onImageSelected]
    );

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
                "w-full h-96 border-2 border-dashed border-slate-700 rounded-3xl",
                "flex flex-col items-center justify-center gap-6",
                "bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer",
                "text-slate-400 hover:text-blue-400 hover:border-blue-500/50"
            )}
        >
            <div className="p-6 bg-slate-900 rounded-full shadow-2xl shadow-blue-900/20">
                <Upload size={48} className="stroke-1" />
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-light text-slate-200 mb-2">Upload plan</h3>
                <p className="text-sm text-slate-500">Sleep of klik om te bladeren</p>
            </div>
            <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
            />
        </div>
    );
}
