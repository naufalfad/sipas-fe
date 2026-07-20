/**
 * ============================================================================
 * GEOSIPAS PRESENTATIONAL COMPONENT — [InspectionLogsGallery.tsx] (REVISED v8.4)
 * ============================================================================
 * Peran: Galeri foto dokumentasi sidak lapangan yang dapat diakses oleh semua
 *        peran dinas (Tim Teknis, Kabid, Kadis, Admin) untuk meninjau bukti fisik.
 * 
 * Pembaruan v8.4: Paralelisasi query dan penyajian terpisah antara log titik darat 
 *                dan video udara drone makro kawasan untuk kepatuhan GRASP.
 * ============================================================================
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
  Video} from 'lucide-react';
import { InspectionLogsMap } from './InspectionLogsMap';

interface InspectionLogsGalleryProps {
  submissionId: string;
  polygon?: [number, number][]; // Koordinat batas bidang tanah dari parent
}

const parseUTCDateTime = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanStr = (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(cleanStr);
};

export function InspectionLogsGallery({ submissionId, polygon }: InspectionLogsGalleryProps) {
  // Query 1: Mengambil Data Kunjungan Lapangan Titik Darat (Ground Inspections)
  const {
    data: groundData,
    isLoading: isGroundLoading,
    isError: isGroundError
  } = useQuery({
    queryKey: ['ground-inspections', submissionId],
    queryFn: () => SubmissionService.getGroundInspections(submissionId),
    refetchInterval: 30_000, // Refresh otomatis tiap 30 detik
  });

  // Query 2: Mengambil Data Rekaman Udara Drone (Aerial Inspection)
  const {
    data: aerialData,
    isLoading: isAerialLoading,
    isError: isAerialError
  } = useQuery({
    queryKey: ['aerial-inspection', submissionId],
    queryFn: () => SubmissionService.getAerialInspection(submissionId),
    refetchInterval: 30_000,
  });

  // State koordinat fokus untuk interaktivitas dengan peta Leaflet
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | null>(null);

  const groundLogs: any[] = groundData?.data ?? [];
  const aerialLog: any = aerialData?.data ?? null;

  const isLoading = isGroundLoading || isAerialLoading;
  const isError = isGroundError || isAerialError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 font-sans">
        <Loader2 size={28} className="animate-spin text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">Memuat berkas dokumentasi sidak lapangan...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-rose-500 font-sans">
        <XCircle size={28} />
        <span className="text-xs font-semibold uppercase tracking-wider">Gagal memproses penarikan data spasial dari server.</span>
      </div>
    );
  }

  // Hitung statistik foto darat
  const validCount = groundLogs.filter((l) => l.isVerified).length;
  const invalidCount = groundLogs.length - validCount;

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER STATS */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200 select-none text-left">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
            Dokumentasi Sidak Lapangan
          </h4>
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 uppercase tracking-wider border">
            {groundLogs.length} Titik Darat
          </div>
          {aerialLog && (
            <div className="text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <Video size={10} /> 1 Dokumentasi Udara
            </div>
          )}
          {validCount > 0 && (
            <div className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={10} /> {validCount} GPS Sesuai
            </div>
          )}
          {invalidCount > 0 && (
            <div className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-250 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <XCircle size={10} /> {invalidCount} Di Luar Lokasi
            </div>
          )}
        </div>
      </div>

      {/* ─── PEMBARUAN v8.4: REKREASI LAYOUT DEDIKASI PANEL DOKUMENTASI UDARA (AERIAL VIEW) ─── */}
      {aerialLog && (
        <div className="border border-slate-300 p-5 bg-slate-50/50 space-y-4 rounded-none text-left select-none animate-in fade-in duration-300">
          <div className="border-b border-slate-200 pb-2.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Video size={15} className="text-teal-700" />
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">Hasil Rekaman Udara Drone (Aerial View)</h5>
            </div>
            <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 text-[8.5px] font-black uppercase tracking-wider rounded-none leading-none">
              AKTIF
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-stretch">
            {/* HTML5 Video Player */}
            <div className="md:w-3/5 aspect-video bg-black border border-slate-200 overflow-hidden relative shrink-0">
              <video
                src={aerialLog.droneVideoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Flight Metadata Card */}
            <div className="md:w-2/5 flex flex-col justify-between space-y-4 font-sans text-xs">
              <div className="space-y-3">
                {aerialLog.notes ? (
                  <p className="font-medium text-slate-600 italic leading-relaxed border-l-2 border-slate-300 pl-3 text-justify">
                    "{aerialLog.notes}"
                  </p>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada catatan rona udara.</p>
                )}

                <div className="grid grid-cols-2 gap-3.5 bg-white p-3 border border-slate-200 text-[10px] text-slate-500">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Pilot Drone / PIC</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <User size={10} className="text-slate-400 shrink-0" />
                      {aerialLog.pilotName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Waktu Penerbangan</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-400 shrink-0" />
                      {new Date(aerialLog.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {aerialLog.flightMetadata && Object.keys(aerialLog.flightMetadata).length > 0 && (
                    <div className="col-span-2 pt-1.5 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                      {aerialLog.flightMetadata.drone_model && (
                        <span>🛸 {aerialLog.flightMetadata.drone_model}</span>
                      )}
                      {aerialLog.flightMetadata.flight_altitude_meters && (
                        <span>📈 {aerialLog.flightMetadata.flight_altitude_meters}m Alt</span>
                      )}
                      {aerialLog.flightMetadata.weather_condition && (
                        <span>☀️ {aerialLog.flightMetadata.weather_condition}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] select-none">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Otoritas Hukum</span>
                <a
                  href={aerialLog.droneVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 decoration-none"
                >
                  Unduh / Buka di Tab Baru ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PETA KONSOLIDATOR SEBARAN LOG INSPEKSI */}
      <div id="inspection-logs-map-container" className="h-[320px] w-full border border-slate-200 relative z-10 bg-slate-100">
        <InspectionLogsMap
          polygon={polygon}
          logs={groundLogs}
          focusedCoords={focusedCoords}
          onFocusReset={() => setFocusedCoords(null)}
          submissionId={submissionId}
        />
      </div>

      {/* GROUND PHOTO GRID */}
      {groundLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 bg-white border border-slate-200 select-none">
          <ImageOff size={28} className="text-slate-300" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Belum Ada Titik Sidak Darat</p>
            <p className="text-[10px] text-slate-400 mt-1">Gunakan perangkat mobile PWA untuk mendaftarkan koordinat foto darat.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {groundLogs.map((log: any, idx: number) => (
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
                      <div className="font-mono leading-tight text-left">
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
      )}

      {/* FOOTER NOTE */}
      <div className="pt-3 border-t border-slate-100 text-[9.5px] text-slate-400 leading-relaxed text-left select-none">
        Foto dengan status <strong className="text-teal-700">LOKASI SESUAI</strong> berarti koordinat GPS petugas saat mengambil foto berada dalam jarak ≤100m dari batas poligon lahan. Foto dengan status <strong className="text-rose-700">DI LUAR LOKASI</strong> berpotensi tidak diambil di lokasi proyek yang sebenarnya secara fisik.
      </div>
    </div>
  );
}