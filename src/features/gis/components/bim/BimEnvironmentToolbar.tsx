import { useEffect, useState } from 'react';
import { useBimStore } from '@/app/store/useBimStore';
import {
  Droplets,
  Layers,
  Move,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Wind,
} from 'lucide-react';

export default function BimEnvironmentToolbar() {
  const viewerMode = useBimStore((s) => s.viewerMode);
  const setViewerMode = useBimStore((s) => s.setViewerMode);

  const sunConfig = useBimStore((s) => s.sunConfig);
  const setSunConfig = useBimStore((s) => s.setSunConfig);

  const envLayers = useBimStore((s) => s.envLayers);
  const setEnvLayers = useBimStore((s) => s.setEnvLayers);

  const [isPlayingSun, setIsPlayingSun] = useState(false);

  // Auto-play sun simulation animation
  useEffect(() => {
    let interval: any = null;
    if (isPlayingSun) {
      interval = setInterval(() => {
        setSunConfig({
          hourOfDay: (sunConfig.hourOfDay + 1) % 24,
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingSun, sunConfig.hourOfDay, setSunConfig]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 border border-slate-800 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-6 select-none">
      {/* 1. Camera Navigation Modes */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setViewerMode('orbit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            viewerMode === 'orbit'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Orbit 3D</span>
        </button>

        <button
          onClick={() => setViewerMode('fly')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            viewerMode === 'fly'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Fly Cam</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-800" />

      {/* 2. Astronomical Sun / Shadow Time Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSunConfig({ enabled: !sunConfig.enabled })}
          className={`p-2 rounded-xl border transition ${
            sunConfig.enabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800/50 text-slate-500 border-slate-800'
          }`}
          title="Toggle Simulasi Matahari"
        >
          <Sun className="w-4 h-4" />
        </button>

        {sunConfig.enabled && (
          <div className="flex items-center gap-3 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setIsPlayingSun(!isPlayingSun)}
              className="text-amber-400 hover:text-amber-300 transition"
            >
              {isPlayingSun ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <span className="font-mono text-slate-200 font-bold min-w-[65px]">
              {String(sunConfig.hourOfDay).padStart(2, '0')}:00 WIB
            </span>

            <input
              type="range"
              min={0}
              max={23}
              value={sunConfig.hourOfDay}
              onChange={(e) => setSunConfig({ hourOfDay: parseInt(e.target.value) })}
              className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-800" />

      {/* 3. Environmental Layer Overlays */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setEnvLayers({ riversActive: !envLayers.riversActive })}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
            envLayers.riversActive
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : 'bg-slate-950/40 text-slate-500 border-slate-800'
          }`}
          title="Toggle Water Shader Sungai (GeoJSON)"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Sungai</span>
        </button>

        <button
          onClick={() => setEnvLayers({ drainageActive: !envLayers.drainageActive })}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
            envLayers.drainageActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-950/40 text-slate-500 border-slate-800'
          }`}
          title="Toggle Jaringan Drainase / Limbah"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Drainase</span>
        </button>

        <button
          onClick={() => setEnvLayers({ airQualityHeatmapActive: !envLayers.airQualityHeatmapActive })}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
            envLayers.airQualityHeatmapActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-950/40 text-slate-500 border-slate-800'
          }`}
          title="Toggle Heatmap Udara & Mikroklimat"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Udara</span>
        </button>
      </div>
    </div>
  );
}
