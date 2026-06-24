import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISLayerControl from '@/components/maps/GISLayerControl';
import GISPolygonLayer from '@/components/maps/GISPolygonLayer';
import type { GISPolygonData } from '@/components/maps/GISPolygonLayer';
import GISMarkerLayer from '@/components/maps/GISMarkerLayer';
import type { GISMarkerData } from '@/components/maps/GISMarkerLayer';
import { Layers, Loader2 } from 'lucide-react';

export default function GISPage() {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll,
  });

  // Prepare polygons from submissions that have layout polygons
  const polygons: GISPolygonData[] = submissions
    .filter(s => s.location.polygon)
    .map(s => ({
      id: s.id,
      positions: s.location.polygon as [number, number][],
      housingName: s.housingName,
      developerName: s.developerName,
      landArea: s.landArea,
      status: s.status,
      // Emerald for approved, Rose for rejected, Teal for others
      color: s.status === 'Disetujui' ? '#10b981' : s.status === 'Ditolak' ? '#f43f5e' : '#0d9488'
    }));

  // Prepare markers
  const markers: GISMarkerData[] = submissions.map(s => ({
    id: s.id,
    position: [s.location.lat, s.location.lng] as [number, number],
    housingName: s.housingName,
    developerName: s.developerName,
    address: s.location.address
  }));

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            GIS Viewer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi spasial plot kavling site plan dan korelasi perizinan tata ruang wilayah.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 border dark:border-slate-700 px-3.5 py-1.5 rounded-lg shadow-sm">
          <Layers className="h-4 w-4 text-teal-600 animate-pulse" />
          <span>Total Terpetakan: {submissions.length} Kavling</span>
        </div>
      </div>

      {/* Map Container Wrapper */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 z-10 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xs flex flex-col justify-center items-center space-y-3">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading spatial layers...</span>
          </div>
        ) : null}

        {/* Leaflet Map integration */}
        <GISMapContainer>
          <GISLayerControl />
          <GISPolygonLayer data={polygons} />
          <GISMarkerLayer data={markers} />
        </GISMapContainer>

        {/* Legend Overlay Panel */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-100 dark:border-slate-750 shadow-lg max-w-xs text-xs space-y-3">
          <h5 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-1.5 uppercase tracking-wider">
            Legenda Peta
          </h5>
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="h-3 w-6 bg-teal-500 rounded border border-teal-600 opacity-60"></span>
              <span className="font-medium text-slate-600 dark:text-slate-350">Sedang Diverifikasi</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="h-3 w-6 bg-emerald-500 rounded border border-emerald-600 opacity-60"></span>
              <span className="font-medium text-slate-600 dark:text-slate-350">Site Plan Disahkan (Aktif)</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="h-3 w-6 bg-rose-500 rounded border border-rose-600 opacity-60"></span>
              <span className="font-medium text-slate-600 dark:text-slate-350">Ditolak / Ditangguhkan</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
