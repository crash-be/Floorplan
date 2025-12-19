import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadZoneProps {
    onImageSelected: (base64: string) => void; // Aangepast naar string omdat we bewerkte base64 sturen
}

export function UploadZone({ onImageSelected }: UploadZoneProps) {

    // De compressie functie
    const compressAndProcess = useCallback((file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1600; // Optimalisatie voor Grok OCR
                const scale = MAX_WIDTH / img.width;

                // Alleen verkleinen als de afbeelding breder is dan 1600px
                const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
                const height = img.width > MAX_WIDTH ? img.height * scale : img.height;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Exporteer als JPEG (veel lichter dan PNG voor base64 transfer)
                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                onImageSelected(optimizedBase64);
            };
        };
    }, [onImageSelected]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                compressAndProcess(file);
            }
        },
        [compressAndProcess]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                compressAndProcess(e.target.files[0]);
            }
        },
        [compressAndProcess]
    );

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
                "relative w-full h-96 border-2 border-dashed border-slate-700 rounded-3xl", // 'relative' toegevoegd voor de input
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