import { useEffect } from 'react';
import { useUIStore } from '@/app/store/useUIStore';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Import Komponen Spasial Inti (Tema Terang Cohesive GFW Style)
import GisNavbar from '../components/GisNavbar';
import SipasMap from '../components/SipasMap';
import GisSidebar from '../components/GisSidebar';
import PanelOrchestrator from '../components/PanelOrchestrator';
import MapHUD from '../components/MapHUD';
import ZoningHorizontalLegend from '../components/ZoningHorizontalLegend';

// --- (3D BIM ENGINE DIPINDAHKAN KE HALAMAN TERSENDIRI) ---

export default function GISPage() {
  const { activeRole } = useUIStore();

  // Tarik ID perumahan terpilih dari store spasial
  useGisUIStore();

  const isExecutive = activeRole === 'Kepala Bidang' || activeRole === 'Super Admin' || activeRole === 'Tim Teknis';

  // Resolusi nama perumahan secara dinamis untuk dikirim sebagai judul modal 3D

  useEffect(() => {
    toast.info(`Kanvas Geospasial GEOSIPAS aktif sebagai: ${activeRole}`);
  }, [activeRole]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased select-none">

      {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA UTAMA 2D/3D - LEAFLET)
          Berada di dasar (z-0) dan mengonsumsi 100% ruang viewport monitor.
      ====================================================================== */}
      <SipasMap />

      {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS)
          Tinggi fix 64px, nempel absolut di atas (top-0), z-50.
      ====================================================================== */}
      <GisNavbar />

      {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI - BRIGHT COHESIVE THEME)
          Lebar fix 64px, menempel di bawah navbar, z-40.
      ====================================================================== */}
      <GisSidebar />

      {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR - STACKING DRAWER)
          Wadah untuk menumpuk laci-laci samping (drawers).
          Mulai dari koordinat left-16 (samping sidebar) dan top-16, z-30.
      ====================================================================== */}
      <PanelOrchestrator />

      {/* =====================================================================
          LAYER 4: AI COPILOT FLOATING TRIGGER
          Tombol melayang taktis asisten kecerdasan buatan untuk Pimpinan.
      ====================================================================== */}
      {isExecutive && (
        <div className="absolute top-[88px] right-6 z-30">
          <button
            type="button"
            onClick={() => toast.success("AI Site Plan Reviewer diaktifkan di panel.")}
            className="relative flex items-center justify-center w-12 h-12 bg-slate-900 border border-teal-500 text-teal-400 hover:bg-teal-600 hover:text-white transition-all shadow-[0_0_15px_rgba(13,148,136,0.4)] rounded-none outline-none group active:scale-95 cursor-pointer"
            title="AI Site Plan Reviewer"
          >
            <div className="absolute inset-0 bg-teal-400/20 animate-ping opacity-30" />
            <Sparkles size={20} className="relative z-10" />
          </button>
        </div>
      )}

      {/* =====================================================================
          LAYER 5: MAP HUD & LEGENDA (KANAN / TENGAH BAWAH)
          HUD Zoom Scale dan legenda mendatar yang terperinci di bawah layar.
      ====================================================================== */}
      <MapHUD />
      <ZoningHorizontalLegend />



    </main>
  );
}