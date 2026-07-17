/**
 * InspectionLogsGallery.tsx (REVISED v8.3)
 * Galeri foto dokumentasi sidak lapangan — dapat diakses oleh semua peran
 * (Tim Teknis, Kabid, Kadis, Admin) untuk meninjau bukti kunjungan fisik verifikator.
 * Terintegrasi dengan visualisasi sebaran spasial log sidak terhadap batas bidang BPN.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '../services/submission.service';
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Clock,
  ImageOff,
  ExternalLink,
} from 'lucide-react';
import { InspectionLogsMap } from './InspectionLogsMap'; // Komponen visualisasi spasial sidak baru

interface InspectionLogsGalleryProps {
  submissionId: string;
  polygon?: [number, number][]; // Menerima data koordinat batas bidang tanah dari expert-parent
}

const parseUTCDateTime = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanStr = (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(cleanStr);
};

export function InspectionLogsGallery({ submissionId, polygon }: InspectionLogsGalleryProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['inspection-logs', submissionId],
    queryFn: () => SubmissionService.getInspectionLogs(submissionId),
    refetchInterval: 30_000, // Refresh tiap 30 detik untuk sinkronisasi data lapangan realtime
  });

  // State koordinat fokus untuk interaktivitas koordinasi dengan peta
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | null>(null);

  const logs: any[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider">Memuat dokumentasi sidak lapangan...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-rose-500">
        <XCircle size={28} />
        <span className="text-xs font-semibold uppercase tracking-wider">Gagal memuat data. Periksa koneksi server.</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <ImageOff size={36} className="text-slate-300" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Belum Ada Dokumentasi Sidak</p>
          <p className="text-xs text-slate-400 mt-1">Tim Inspeksi belum mengunggah foto kunjungan lapangan untuk berkas ini.</p>
        </div>
      </div>
    );
  }

  // Hitung statistik cepat
  const validCount = logs.filter((l) => l.isVerified).length;
  const invalidCount = logs.length - validCount;

  return (
    <div className="space-y-6">
      {/* HEADER STATS */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
            Dokumentasi Sidak Lapangan
          </h4>
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 uppercase tracking-wider">
            {logs.length} Foto Total
          </div>
          {validCount > 0 && (
            <div className="text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={10} /> {validCount} Lokasi Sesuai
            </div>
          )}
          {invalidCount > 0 && (
            <div className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <XCircle size={10} /> {invalidCount} Di Luar Lokasi
            </div>
          )}
        </div>
      </div>

      {/* PETA KONSOLIDATOR SEBARAN LOG INSPEKSI */}
      <div id="inspection-logs-map-container" className="h-[320px] w-full border border-slate-200 relative z-10 bg-slate-100">
        <InspectionLogsMap
          polygon={polygon}
          logs={logs}
          focusedCoords={focusedCoords}
          onFocusReset={() => setFocusedCoords(null)}
          submissionId={submissionId}
        />
      </div>

      {/* PHOTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {logs.map((log: any, idx: number) => (
          <div key={log.id ?? idx} className="border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              {/* PHOTO BOX */}
              <div className="relative bg-slate-900 aspect-video overflow-hidden">
                {log.photoUrl ? (
                  <img
                    src={log.photoUrl}
                    alt={`Dokumentasi sidak #${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-slate-500 text-xs">Foto tidak tersedia</div>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Foto tidak tersedia
                  </div>
                )}

                {/* SEQUENCE NUMBER */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
                  #{idx + 1}
                </div>

                {/* LOCATION STATUS BADGE */}
                <div className={`absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 flex items-center gap-1 ${log.isVerified ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {log.isVerified ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                  {log.isVerified ? 'LOKASI SESUAI' : 'DI LUAR LOKASI'}
                </div>

                {/* OPEN FULL IMAGE LINK */}
                {log.photoUrl && (
                  <a
                    href={log.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 transition-colors"
                    title="Buka foto ukuran penuh"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* LOG METADATA */}
              <div className="p-3.5 space-y-3">
                {/* CATATAN SURVEI */}
                {log.notes && (
                  <p className="text-[10px] text-slate-700 leading-normal font-medium border-l-2 border-slate-300 pl-2 text-justify">
                    "{log.notes}"
                  </p>
                )}

                <div className="space-y-1.5 text-[9.5px] text-slate-500">
                  {/* PETUGAS */}
                  <div className="flex items-center gap-1.5">
                    <User size={10} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 truncate">{log.inspectorName || '—'}</span>
                  </div>

                  {/* WAKTU */}
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} className="text-slate-400 shrink-0" />
                    <span>
                      {log.timestamp
                        ? parseUTCDateTime(log.timestamp).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Jakarta'
                        })
                        : '—'}
                    </span>
                  </div>

                  {/* KOORDINAT GPS */}
                  <div className="flex items-start gap-1.5">
                    <MapPin size={10} className={`shrink-0 mt-0.5 ${log.isVerified ? 'text-teal-500' : 'text-rose-400'}`} />
                    <div className="font-mono leading-tight">
                      {log.latitude !== null && log.longitude !== null ? (
                        <>
                          <span className="block">{Number(log.latitude).toFixed(6)}, {Number(log.longitude).toFixed(6)}</span>
                          {log.distanceMeters !== null && log.distanceMeters !== undefined && (
                            <span className={`font-black text-[8.5px] ${log.isVerified ? 'text-teal-600' : 'text-rose-600'}`}>
                              Deviasi: {Number(log.distanceMeters).toFixed(1)}m dari batas lahan
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic">Koordinat tidak tersedia</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD ACTIONS (INTERACTIVE FLY-TO CONTROLLER) */}
            <div className="px-3.5 pb-3">
              {log.latitude !== null && log.longitude !== null && (
                <div className="pt-2.5 border-t border-slate-100 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedCoords([Number(log.latitude), Number(log.longitude)]);
                      document.getElementById('inspection-logs-map-container')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[9px] font-black text-teal-700 hover:text-teal-800 transition-colors uppercase tracking-widest flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 outline-none"
                  >
                    <MapPin size={11} className="text-teal-600" />
                    <span>Fokus Kamera Peta</span>
                  </button>
                </div>
              )}
              {/* GEOFENCE COLOR STRIP */}
              <div className={`h-1 w-full mt-3 ${log.isVerified ? 'bg-teal-500' : 'bg-rose-500'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER NOTE */}
      <div className="pt-3 border-t border-slate-100 text-[9.5px] text-slate-400 leading-relaxed">
        Foto dengan status <strong className="text-teal-700">LOKASI SESUAI</strong> berarti koordinat GPS petugas saat mengambil foto berada dalam jarak ≤100m dari batas poligon lahan. Foto dengan status <strong className="text-rose-700">DI LUAR LOKASI</strong> berpotensi tidak diambil di lokasi proyek yang sebenarnya.
      </div>
    </div>
  );
}