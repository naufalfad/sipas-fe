import { useEffect, useRef, useState } from 'react';
import { useBimStore } from '@/app/store/useBimStore';
import { BimViewerEngineFacade } from '../../bim/BimViewerEngineFacade';
import { BimEventBus } from '../../bim/BimEventBus';
import { Box, Compass, Layers, Loader2, Sparkles, Sun, Eye } from 'lucide-react';

export default function BimViewportCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const facadeRef = useRef<BimViewerEngineFacade | null>(null);

  const [isEngineReady, setIsEngineReady] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);

  const activeParcelId = useBimStore((s) => s.activeParcelId);
  const sunConfig = useBimStore((s) => s.sunConfig);
  const envLayers = useBimStore((s) => s.envLayers);
  const setSelectedElement = useBimStore((s) => s.setSelectedElement);
  const setRtcAnchor = useBimStore((s) => s.setRtcAnchor);
  const setActiveTileset = useBimStore((s) => s.setActiveTileset);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inisialisasi Facade 3D Engine Single Entry Point (GRASP Facade)
    const facade = new BimViewerEngineFacade();
    facadeRef.current = facade;
    const eventBus = BimEventBus.getInstance();

    // 1. Subscribe to BimEventBus (Low Coupling WebGL -> Zustand)
    const unsubSelection = eventBus.subscribe('BIM_ELEMENT_SELECTED', (data) => {
      setSelectedElement(data.metadata);
    });

    const unsubAnchor = eventBus.subscribe('RTC_ANCHOR_UPDATED', (anchor) => {
      setRtcAnchor(anchor);
    });

    const unsubProgress = eventBus.subscribe('TILES_PROGRESS', (progress) => {
      setLoadPercent(progress.percentLoaded);
    });

    // 2. Initialize Engine & Load Tileset with RTC Origin Shift
    facade.initializeEngine(containerRef.current).then(() => {
      facade.loadParcelAndTileset(106.7892, -6.5944).then((tilesetSpec) => {
        setActiveTileset(tilesetSpec);
        setIsEngineReady(true);
      });
    });

    // 3. Cleanup on Unmount (GRASP Pure Fabrication GPU Disposal)
    return () => {
      unsubSelection();
      unsubAnchor();
      unsubProgress();
      facade.disposeEngine();
      facadeRef.current = null;
    };
  }, [activeParcelId, setSelectedElement, setRtcAnchor, setActiveTileset]);

  // Sync Sun Simulation Config when store changes
  useEffect(() => {
    if (facadeRef.current && isEngineReady) {
      facadeRef.current.updateSunSimulation(sunConfig);
    }
  }, [sunConfig, isEngineReady]);

  // Sync Environment Layers when store changes
  useEffect(() => {
    if (facadeRef.current && isEngineReady) {
      facadeRef.current.updateEnvironmentLayers(envLayers);
    }
  }, [envLayers, isEngineReady]);

  // Handler Klik Canvas Raycast Interactive Picking
  const handleCanvasClick = () => {
    if (!facadeRef.current || !isEngineReady) return;
    // Trigger raycasting pada 3D Scene
    facadeRef.current.executeRaycastSelect();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-crosshair select-none"
    >
      {/* Grid Pattern Background Simulated 3D WebGL Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Visual Render Scene Mock - Simulated 3D Building Geometry */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-96 h-96 border border-teal-500/30 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/90 backdrop-blur-md shadow-2xl p-6 flex flex-col justify-between transform perspective-1000 rotate-x-12 rotate-y-6 transition-all duration-700 hover:scale-105">
          {/* Top Axis Compass Indicator */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-400 animate-spin-slow" />
              <span className="text-xs font-mono text-slate-300 font-bold">RTC Origin Center [0,0,0]</span>
            </div>
            <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-mono">
              EPSG:4326 Bogor
            </span>
          </div>

          {/* Simulated 3D Building Columns & Beams Structure */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-3 bg-slate-800/80 border border-teal-500/40 rounded-lg shadow-inner flex flex-col items-center justify-center group">
              <Box className="w-8 h-8 text-teal-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-slate-200">IfcColumn (K1)</span>
              <span className="text-[9px] text-slate-400 font-mono">GUID: #col-001</span>
            </div>

            <div className="p-3 bg-slate-800/80 border border-cyan-500/40 rounded-lg shadow-inner flex flex-col items-center justify-center group">
              <Layers className="w-8 h-8 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-slate-200">IfcBeam (B1)</span>
              <span className="text-[9px] text-slate-400 font-mono">GUID: #beam-102</span>
            </div>
          </div>

          {/* Environmental Overlay Shaders (Water & Air) */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Raycast Click Active</span>
            </div>
            <div className="flex items-center gap-2">
              {envLayers.riversActive && (
                <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded">
                  Water Shader
                </span>
              )}
              {sunConfig.enabled && (
                <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Sun className="w-2.5 h-2.5" /> {sunConfig.hourOfDay}:00
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isEngineReady && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-3" />
          <span className="text-sm font-medium text-slate-200">Pemuatan 3D Tiles & RTC Origin Alignment...</span>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${loadPercent}%` }} />
          </div>
        </div>
      )}

      {/* Interactive Raycast Prompt Banner */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex items-center gap-2 pointer-events-none shadow-lg">
        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
        <span>Klik pada geometri 3D untuk inspeksi metadata spesifikasi elemen BIM.</span>
      </div>
    </div>
  );
}
