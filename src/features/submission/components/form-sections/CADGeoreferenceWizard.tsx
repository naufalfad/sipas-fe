import { useState } from 'react';
import { Settings2, Compass, Loader2, RefreshCw } from 'lucide-react';
import { Polygon as LeafletPolygon } from 'react-leaflet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GISMapContainer from '@/components/maps/GISMapContainer';

import { MOCK_SITE_BOUNDS, MOCK_SITEPLAN_CONTROL_POINTS } from '@/mock/siteplan/mockSiteConfig';

export const CADGeoreferenceWizard = ({
  isOpen,
  onClose,
  onComplete,
  cadFileName,
  landPolygon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (params: {
    polygon: [number, number][];
    anchorCad1: [number, number]; anchorCad2: [number, number];
    anchorMap1: [number, number]; anchorMap2: [number, number];
  }) => void;
  cadFileName: string;
  landPolygon?: [number, number][];
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [point1Mapped, setPoint1Mapped] = useState(false);
  const [point2Mapped, setPoint2Mapped] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  if (!isOpen) return null;

  // Temukan konfigurasi titik kontrol berdasarkan nama berkas CAD dengan pencarian pintar
  const activeControlConfig = 
    MOCK_SITEPLAN_CONTROL_POINTS[cadFileName] ||
    Object.entries(MOCK_SITEPLAN_CONTROL_POINTS).find(([k]) => 
      cadFileName.toLowerCase().includes(k.toLowerCase().replace(/\.(dxf|dwg)$/, ''))
    )?.[1] ||
    (cadFileName.toLowerCase().includes('geocitra') 
      ? MOCK_SITEPLAN_CONTROL_POINTS['CAD_Siteplan_Tahap1_Geocitra.dxf'] 
      : MOCK_SITEPLAN_CONTROL_POINTS['sample_siteplan.dxf']);
  const normalizedLandPolygon = landPolygon?.map(([first, second]) =>
    first < 20 && second > 90 ? [second, first] as [number, number] : [first, second] as [number, number]
  );
  const targetPolygon = normalizedLandPolygon?.length
    ? normalizedLandPolygon
    : activeControlConfig?.polygon;
  const openTargetPolygon = targetPolygon?.length && targetPolygon.length > 1 &&
    targetPolygon[0][0] === targetPolygon[targetPolygon.length - 1][0] &&
    targetPolygon[0][1] === targetPolygon[targetPolygon.length - 1][1]
    ? targetPolygon.slice(0, -1)
    : targetPolygon;
  const targetControlPoints = openTargetPolygon && openTargetPolygon.length >= 3
    ? [
        openTargetPolygon.reduce((northWest, point) => point[0] - point[1] < northWest[0] - northWest[1] ? point : northWest),
        openTargetPolygon.reduce((southEast, point) => point[0] - point[1] > southEast[0] - southEast[1] ? point : southEast),
      ] as [[number, number], [number, number]]
    : undefined;
  const mapCenter: [number, number] = openTargetPolygon?.length
    ? [
        openTargetPolygon.reduce((sum, point) => sum + point[1], 0) / openTargetPolygon.length,
        openTargetPolygon.reduce((sum, point) => sum + point[0], 0) / openTargetPolygon.length,
      ]
    : MOCK_SITE_BOUNDS.center;

  const handleMapPoint1 = () => {
    if (!activeControlConfig) {
      toast.error('File CAD ini belum memiliki titik kontrol georeferensi.');
      return;
    }
    setPoint1Mapped(true);
    toast.success('Titik Kontrol 1 (Barat Laut) berhasil dikunci!');
    setStep(2);
  };

  const handleMapPoint2 = () => {
    if (!activeControlConfig) {
      toast.error('File CAD ini belum memiliki titik kontrol georeferensi.');
      return;
    }
    setPoint2Mapped(true);
    toast.success('Titik Kontrol 2 (Tenggara) berhasil dikunci!');
    setStep(3);
  };

  const handleRunCalibration = () => {
    if (!activeControlConfig) {
      toast.error('File CAD ini belum memiliki titik kontrol georeferensi.');
      return;
    }
    setIsCalibrating(true);
    setTimeout(() => {
      const transformedPolygon = targetPolygon ?? activeControlConfig.polygon;
      const anchorMap1 = targetControlPoints?.[0] ?? activeControlConfig.anchor_map_1;
      const anchorMap2 = targetControlPoints?.[1] ?? activeControlConfig.anchor_map_2;

      onComplete({
        polygon: transformedPolygon,
        anchorCad1: activeControlConfig.anchor_cad_1,
        anchorCad2: activeControlConfig.anchor_cad_2,
        anchorMap1,
        anchorMap2,
      });
      setIsCalibrating(false);
      toast.success('Titik kontrol tersimpan. Geometri DXF akan diproses saat pengajuan dikirim.');
      onClose();
    }, 1500);
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
            {!activeControlConfig && 'File ini belum mempunyai konfigurasi titik kontrol. Kalibrasi otomatis hanya tersedia untuk file siteplan yang dikenali.'}
            {activeControlConfig && step === 1 && 'Langkah 1: Klik Titik Batas Tanah Barat Laut di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {activeControlConfig && step === 2 && 'Langkah 2: Klik Titik Batas Tanah Tenggara di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
            {activeControlConfig && step === 3 && 'Langkah 3: Koordinat kontrol terkunci. Jalankan kalkulasi matriks Helmert untuk mentranslasikan denah CAD.'}
          </p>
        </div>

        {/* Main Split Panels Workspace */}
        <div className="flex-1 flex divide-x divide-slate-200 min-h-0">

          {/* Panel Kiri: Peta Target (Peta Bumi Nyata) */}
          <div className="w-1/2 h-full relative">
            <div className="absolute top-3 left-3 z-10 bg-white border border-slate-200 px-2.5 py-1 text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">
              Peta Spasial Target (GIS)
            </div>
            <GISMapContainer center={mapCenter} zoom={MOCK_SITE_BOUNDS.zoom}>
              {openTargetPolygon && (
                <LeafletPolygon
                  positions={openTargetPolygon.map(([longitude, latitude]) => [latitude, longitude])}
                  pathOptions={{ color: '#0d9488', weight: 2, fillOpacity: 0.15 }}
                />
              )}
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
            disabled={step !== 3 || isCalibrating || !activeControlConfig}
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
