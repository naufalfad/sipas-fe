import { useState } from 'react';
import { Settings2, Compass, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GISMapContainer from '@/components/maps/GISMapContainer';

export const CADGeoreferenceWizard = ({
  isOpen,
  onClose,
  onComplete,
  cadFileName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (params: {
    A: number; B: number; Tx: number; Ty: number;
    scale: number; rotation: number; polygon: [number, number][]
  }) => void;
  cadFileName: string;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [point1Mapped, setPoint1Mapped] = useState(false);
  const [point2Mapped, setPoint2Mapped] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  if (!isOpen) return null;

  const handleMapPoint1 = () => {
    setPoint1Mapped(true);
    toast.success('Titik Kontrol 1 berhasil dikunci!');
    setStep(2);
  };

  const handleMapPoint2 = () => {
    setPoint2Mapped(true);
    toast.success('Titik Kontrol 2 berhasil dikunci!');
    setStep(3);
  };

  const handleRunCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      // Simulasi perhitungan parameter matriks Helmert 2D [Jakarta 5]
      const scale = 1.0024;
      const rotation = 0.4812; // rad (~27.5 derajat)
      const Tx = 106.8400;
      const Ty = -6.4800;
      const A = scale * Math.cos(rotation);
      const B = scale * Math.sin(rotation);

      // Hasil poligon georeferenced bumi nyata [Longitude, Latitude]
      const transformedPolygon: [number, number][] = [
        [106.8400, -6.4800],
        [106.8413, -6.4798],
        [106.8414, -6.4804],
        [106.8422, -6.4802],
        [106.8420, -6.4793],
        [106.8426, -6.4789],
        [106.8417, -6.4785],
        [106.8410, -6.4789],
        [106.8407, -6.4787],
        [106.8396, -6.4791],
        [106.8398, -6.4795],
        [106.8394, -6.4797],
        [106.8400, -6.4800]
      ];

      onComplete({ A, B, Tx, Ty, scale, rotation, polygon: transformedPolygon });
      setIsCalibrating(false);
      toast.success('Kalibrasi Helmert 2D Berhasil!', {
        description: `Skala: ${scale.toFixed(4)} | Rotasi: ${(rotation * (180 / Math.PI)).toFixed(1)}°`,
      });
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-4xl flex flex-col shadow-2xl h-[85vh]">

        {/* Header Wizard */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-left shrink-0">
          <div>
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">CAD Spasial Aligner</span>
            <h3 className="text-xs font-bold text-slate-800 leading-tight mt-1.5 uppercase">
              wizard penyelarasan koordinat: {cadFileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 font-bold text-sm cursor-pointer outline-none border-none bg-transparent"
          >
            Batal
          </button>
        </div>

        {/* Wizard Guide */}
        <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 text-left text-[11px] font-semibold text-amber-800 leading-relaxed flex items-center gap-2.5 shrink-0">
          <Settings2 className="h-4.5 w-4.5 shrink-0 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
          <p>
            {step === 1 && 'Langkah 1: Klik Titik Batas Tanah Barat Laut di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {step === 2 && 'Langkah 2: Klik Titik Batas Tanah Tenggara di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {step === 3 && 'Langkah 3: Koordinat kontrol terkunci. Jalankan kalkulasi matriks Helmert untuk mentranslasikan denah CAD.'}
          </p>
        </div>

        {/* Main Split Panels Workspace */}
        <div className="flex-1 flex divide-x divide-slate-200 min-h-0">

          {/* Panel Kiri: Peta Target (Peta Bumi Nyata) */}
          <div className="w-1/2 h-full relative">
            <div className="absolute top-3 left-3 z-10 bg-white border border-slate-200 px-2.5 py-1 text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">
              Peta Spasial Target (GIS)
            </div>
            <GISMapContainer center={[-6.4800, 106.8400]} zoom={16}>
              {/* Titik Jangkar Peta */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
                {step === 1 && (
                  <div className="relative flex items-center justify-center h-8 w-8">
                    <span className="absolute h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-teal-600 border border-white" />
                  </div>
                )}
                {step === 2 && (
                  <div className="relative flex items-center justify-center h-8 w-8 translate-x-12 translate-y-12">
                    <span className="absolute h-full w-full rounded-full bg-amber-400 opacity-70 animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-amber-600 border border-white" />
                  </div>
                )}
              </div>
            </GISMapContainer>
          </div>

          {/* Panel Kanan: Gambar CAD (Koordinat Lokal) */}
          <div className="w-1/2 h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-3 z-10 bg-slate-900 border border-slate-700 px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Gambar Kerja CAD (Lokal 0,0)
            </div>

            {/* Simulasi Gambar CAD Vektor */}
            <div className="relative w-64 h-64 border border-slate-800 flex items-center justify-center">
              <Compass className="absolute top-2 right-2 text-slate-700 animate-spin-slow" size={24} />
              <div className="w-48 h-48 border-2 border-dashed border-teal-500/60 bg-teal-500/5 relative flex items-center justify-center">
                <span className="text-[10px] font-mono text-teal-500/40 select-none">LAY_PTSP_KDB</span>

                {/* Titik Kontrol CAD 1 */}
                <button
                  type="button"
                  disabled={step !== 1}
                  onClick={handleMapPoint1}
                  className={cn(
                    "absolute -top-2 -left-2 h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                    point1Mapped
                      ? "bg-teal-600 border-white text-white"
                      : "bg-slate-900 border-teal-500 text-teal-400 hover:scale-115"
                  )}
                >
                  <span className="text-[9px] font-black leading-none">1</span>
                </button>

                {/* Titik Kontrol CAD 2 */}
                <button
                  type="button"
                  disabled={step !== 2}
                  onClick={handleMapPoint2}
                  className={cn(
                    "absolute -bottom-2 -right-2 h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                    point2Mapped
                      ? "bg-amber-600 border-white text-white"
                      : "bg-slate-900 border-amber-500 text-amber-400 hover:scale-115"
                  )}
                >
                  <span className="text-[9px] font-black leading-none">2</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Wizard Controls */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Status Titik Ikat:</span>
            <span className={point1Mapped ? 'text-teal-600 font-bold' : 'text-slate-400'}>
              [1] {point1Mapped ? 'Terkunci' : 'Belum Terikat'}
            </span>
            <span>•</span>
            <span className={point2Mapped ? 'text-amber-600 font-bold' : 'text-slate-400'}>
              [2] {point2Mapped ? 'Terkunci' : 'Belum Terikat'}
            </span>
          </div>

          <button
            type="button"
            disabled={step !== 3 || isCalibrating}
            onClick={handleRunCalibration}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 disabled:bg-slate-200 hover:bg-teal-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-none transition-colors border-none outline-none cursor-pointer"
          >
            {isCalibrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Memproses Helmert 2D...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Kalkulasi & Sinkronisasi Spasial</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
