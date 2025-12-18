import { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { Workspace } from './components/Workspace';
import { Layout, Calculator, Settings } from 'lucide-react';

function App() {
  const [image, setImage] = useState<string | null>(null);

  const handleImageSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Layout size={20} className="text-white" />
          </div>
          <span className="font-medium text-lg tracking-tight">Offerte generator</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
            <Calculator size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-slate-400">Ready</span>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 px-6 mb-6 flex flex-col h-screen">
        {!image ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-extralight mb-4 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent pb-2">
                Offerte generator
              </h1>
              <p className="text-slate-500 text-lg">
                Upload uw plan hier.
              </p>
            </div>
            <UploadZone onImageSelected={handleImageSelected} />

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setImage("")} // Empty string signals blank workspace logic (or we can change state type)
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-2"
              >
                <span>✏️ Teken uw plan hier. </span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden relative">
            <Workspace image={image} />

            <button
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors z-30 shadow-lg border border-slate-700"
            >
              Reset
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
