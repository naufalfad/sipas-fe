import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBimStore } from '@/app/store/useBimStore';
import BimViewportCanvas from '../components/bim/BimViewportCanvas';
import BimPropertyPanel from '../components/bim/BimPropertyPanel';
import BimEnvironmentToolbar from '../components/bim/BimEnvironmentToolbar';
import {
  ArrowLeft,
  Box,
  Download,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function BimReviewerPage() {
  const navigate = useNavigate();
  const { parcelId } = useParams<{ parcelId?: string }>();
  const setActiveParcel = useBimStore((s) => s.setActiveParcel);

  useEffect(() => {
    if (parcelId) {
      setActiveParcel({
        id: parcelId,
        name: `Persil Lahan #${parcelId}`,
        nop: `32.01.040.005.${parcelId}`,
        areaM2: 15400,
        zone: 'Kawasan Perdagangan & Jasa (K3)',
      });
    }
  }, [parcelId, setActiveParcel]);

  const activeParcelName = useBimStore((s) => s.activeParcelName);
  const activeParcelNop = useBimStore((s) => s.activeParcelNop);
  const activeParcelZone = useBimStore((s) => s.activeParcelZone);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportAuditReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Laporan Audit Spesifikasi 3D BIM & Spasial Bogor berhasil di-generate!');
    }, 1500);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* 1. TOP NAVIGATION BAR HEADER */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between z-30 backdrop-blur-xl">
        {/* Left Section: Back Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/gis')}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke GIS 2D</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <Box className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-100">BIM Reviewer 3D Real-Time</h1>
                <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.2 rounded font-mono">
                  OGC 3D Tiles RTC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>{activeParcelName} — {activeParcelZone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: NOP Badge Search Info */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">NOP:</span>
          <span className="font-mono text-teal-300 font-bold">{activeParcelNop}</span>
        </div>

        {/* Right Section: Audit Export & Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAuditReport}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-900 font-bold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Laporan Audit BIM</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT & PANEL CONTAINER */}
      <div className="relative flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Full-Page WebGL 3D Canvas Viewport */}
        <BimViewportCanvas />

        {/* Collapsible Right-Side Property Inspector Panel */}
        <BimPropertyPanel />

        {/* Bottom Center Floating HUD Toolbar */}
        <BimEnvironmentToolbar />
      </div>
    </div>
  );
}
