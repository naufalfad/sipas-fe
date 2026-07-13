import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Map, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info, MapPin, Building, Calendar, HelpCircle
} from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { SubmissionService } from '@/features/submission/services/submission.service';
import { useSpatialValidator, type SpatialAuditResult } from '@/features/gis/hooks/useSpatialValidator';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config';

// Leaflet map controller to automatically fit bounds of coordinates
function MapBoundsController({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 2) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

export default function SitePlanDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ─── LOCAL STATE FOR OVERLAYS & RESULTS ───
  const [showSungai, setShowSungai] = useState(false);
  const [showRelka, setShowRelka] = useState(false);
  const [showSawah, setShowSawah] = useState(false);
  const [showPemukiman, setShowPemukiman] = useState(false);

  const [sungaiData, setSungaiData] = useState<any>(null);
  const [relkaData, setRelkaData] = useState<any>(null);
  const [sawahData, setSawahData] = useState<any>(null);
  const [pemukimanData, setPemukimanData] = useState<any>(null);

  const [spatialResult, setSpatialResult] = useState<SpatialAuditResult | null>(null);

  // ─── QUERY DATA PERMOHONAN ───
  const { data: submission, isLoading: isSubLoading, isError: isSubError } = useQuery({
    queryKey: ['siteplan-detail', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id
  });

  // ─── QUERY CAD/SHP GEOJSON SITE PLAN ───
  const [cadGeoJson, setCadGeoJson] = useState<any>(null);
  const [isCadLoading, setIsCadLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsCadLoading(true);
    const token = sessionStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/v1/submissions/${id}/geojson`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Gagal memuat CAD GeoJSON');
      })
      .then(data => {
        setCadGeoJson(data);
      })
      .catch(err => console.error(err))
      .finally(() => setIsCadLoading(false));
  }, [id]);

  // ─── DYNAMIC OVERLAY DOCK LOADERS ───
  useEffect(() => {
    if (showSungai && !sungaiData) {
      import('@/assets/geojson/bogor/SUNGAI_LN_25K.json')
        .then(m => setSungaiData(m.default)).catch(console.error);
    }
  }, [showSungai, sungaiData]);

  useEffect(() => {
    if (showRelka && !relkaData) {
      import('@/assets/geojson/kab bogor/RELKA_LN_25K.json')
        .then(m => setRelkaData(m.default)).catch(console.error);
    }
  }, [showRelka, relkaData]);

  useEffect(() => {
    if (showSawah && !sawahData) {
      import('@/assets/geojson/bogor/AGRISAWAH_AR_25K.json')
        .then(m => setSawahData(m.default)).catch(console.error);
    }
  }, [showSawah, sawahData]);

  useEffect(() => {
    if (showPemukiman && !pemukimanData) {
      import('@/assets/geojson/bogor/PEMUKIMAN_AR_25K.json')
        .then(m => setPemukimanData(m.default)).catch(console.error);
    }
  }, [showPemukiman, pemukimanData]);

  // ─── TURF.JS SPATIAL AUDIT TRIGGER ───
  const { validateRiverBuffer, isProcessing: isAuditing } = useSpatialValidator();

  useEffect(() => {
    if (!submission?.location?.polygon || submission.location.polygon.length < 3) return;
    
    const runAudit = async () => {
      const result = await validateRiverBuffer(
        submission.location.polygon || [],
        submission.submissionDetails?.category || 'PERUMAHAN'
      );
      setSpatialResult(result);
    };

    runAudit();
  }, [submission, validateRiverBuffer]);

  // Normalize outer polygon coordinates for leaflet display
  const leafletOuterCoords = useMemo(() => {
    if (!submission?.location?.polygon) return [];
    return submission.location.polygon.map(([a, b]) => {
      const isLatFirst = a < 20 && b > 90;
      return isLatFirst ? [a, b] : [b, a] as [number, number];
    });
  }, [submission]);

  // Center coordinate of the map
  const mapCenter: [number, number] = useMemo(() => {
    if (submission?.location?.lat && submission?.location?.lng) {
      return [submission.location.lat, submission.location.lng];
    }
    if (leafletOuterCoords.length > 0) {
      return leafletOuterCoords[0];
    }
    return [-6.4816, 106.8560]; // Bogor fallback
  }, [submission, leafletOuterCoords]);

  // Render loading state
  if (isSubLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent animate-spin rounded-none" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Memuat detail spasial site plan...</p>
      </div>
    );
  }

  // Render error state
  if (isSubError || !submission) {
    return (
      <div className="p-8 text-center bg-white border border-border space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 uppercase">Gagal Memuat Berkas</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Data permohonan site plan tidak ditemukan atau server mengalami kendala jaringan.
        </p>
        <Link to="/siteplan/daftar" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Format numbers for areas
  const formatArea = (val?: number) => {
    if (!val) return '0';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link to="/siteplan/daftar" className="p-1.5 border border-border hover:bg-slate-100 transition-colors rounded-none">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#111D13] leading-none">
              Detail Geospasial: {submission.housingName || 'Site Plan'}
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
              No Berkas: {submission.submissionNo} | Kategori: {submission.submissionDetails?.category || '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className={`rounded-none px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider ${
            submission.status === 'Disetujui' ? 'bg-[#e8f2ea] text-[#415D43] border border-[#a3c9a8]' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {submission.status}
          </Badge>
        </div>
      </div>

      {/* ─── TWO COLUMN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ================= LEFT COLUMN: INFOS & SPATIAL AUDITS ================= */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
          
          {/* Panel 1: Legalitas & Kepemilikan Lahan */}
          <div className="bg-white border border-border p-5 space-y-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2 border-b border-border/80 pb-2">
              <Building className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Informasi & Kepemilikan Lahan
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Kegiatan</span>
                <span className="font-semibold text-slate-800">{submission.housingName || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Pengembang</span>
                <span className="font-semibold text-slate-800">{submission.developerName || '-'}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Alamat Lokasi Proyek</span>
                <span className="text-slate-600 font-medium leading-relaxed">{submission.locationDetails?.fullAddress || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Hak Tanah</span>
                <span className="font-bold text-primary">{submission.locationDetails?.ownershipStatus || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">No. Sertifikat Tanah</span>
                <span className="font-mono font-semibold text-slate-800">{submission.locationDetails?.certificateNumber || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Pemilik Sertifikat</span>
                <span className="font-semibold text-slate-800">{submission.locationDetails?.certificateOwner || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Luas Lahan Terdaftar</span>
                <span className="font-mono font-bold text-slate-800">{formatArea(submission.landArea)} m²</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Metrik Intensitas Site Plan */}
          <div className="bg-white border border-border p-5 space-y-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2 border-b border-border/80 pb-2">
              <Layers className="h-4 w-4 text-[#709775]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Batas Intensitas & Tata Ruang
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-50 border border-slate-100 p-2.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">KDB Maks (RDTR)</span>
                <span className="block text-base font-bold font-mono text-slate-700 mt-1">
                  {submission.bylawMaxKdb ? `${submission.bylawMaxKdb}%` : '-'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">KDH Min (RDTR)</span>
                <span className="block text-base font-bold font-mono text-slate-700 mt-1">
                  {submission.bylawMinKdh ? `${submission.bylawMinKdh}%` : '-'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Min. RTH (RDTR)</span>
                <span className="block text-sm font-bold font-mono text-slate-700 mt-1.5">
                  {submission.bylawMinRthArea ? `${formatArea(submission.bylawMinRthArea)} m²` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 3: Hasil Spasial Audit (Turf.js) */}
          <div className="bg-white border border-border p-5 space-y-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] flex-1">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Hasil Audit Spasial (Turf.js)
                </h3>
              </div>
              {isAuditing && (
                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {spatialResult ? (
              <div className="space-y-4">
                {/* Score and Verdict Header */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Kelayakan Spasial</span>
                    <span className={`block text-sm font-extrabold mt-0.5 ${
                      spatialResult.verdict === 'LAYAK' ? 'text-primary' :
                      spatialResult.verdict === 'PERLU_REVISI' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {spatialResult.verdict === 'LAYAK' ? 'LAYAK (ZONA AMAN)' :
                       spatialResult.verdict === 'PERLU_REVISI' ? 'PERLU REVISI ZONASI' : 'TIDAK LAYAK (VETO LINDUNG)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Skor Kepatuhan</span>
                    <span className={`block text-xl font-bold font-mono ${
                      spatialResult.zoningScore > 80 ? 'text-primary' :
                      spatialResult.zoningScore > 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {spatialResult.zoningScore}/100
                    </span>
                  </div>
                </div>

                {/* Overlap Breakdown List */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {spatialResult.details.map((detail) => {
                    const hasClash = detail.clashAreaSqm > 0;
                    return (
                      <div key={detail.layerId} className="flex gap-2.5 border border-slate-100 p-2.5 bg-slate-50/30 text-xs">
                        <div className="shrink-0 mt-0.5">
                          {detail.severity === 'danger' && hasClash ? (
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                          ) : detail.severity === 'warning' && hasClash ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{detail.layerName}</span>
                            {hasClash && (
                              <span className={`font-mono text-[10px] font-bold ${
                                detail.severity === 'danger' ? 'text-rose-600' : 'text-amber-600'
                              }`}>
                                {formatArea(detail.clashAreaSqm)} m²
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{detail.description}</p>
                          {detail.zoningNote && (
                            <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-normal">
                              <Info className="h-2.5 w-2.5" />
                              <span>{detail.zoningNote}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Menghitung matriks persilangan spasial...</p>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE GIS DETAIL MAP ================= */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Map & Legends Container */}
          <div className="bg-white border border-border p-4 shadow-[1px_1px_3px_rgba(0,0,0,0.01)] flex flex-col flex-1 relative min-h-[500px]">
            
            <div className="flex items-center justify-between border-b border-border/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Peta Detail Spasial AutoCAD & SHP
                </h3>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {submission.coordinate?.cadFileName || 'TIDAK ADA CAD FILE'}
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative border border-border overflow-hidden bg-slate-100 z-10" style={{ height: '400px' }}>
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                />

                {/* Bounds Controller to automatically focus boundary */}
                <MapBoundsController coords={leafletOuterCoords} />

                {/* ─── 1. OVERLAY SPASIAL KABUPATEN BOGOR (BACKGROUND) ─── */}
                {showPemukiman && pemukimanData && (
                  <GeoJSON
                    key="pemukiman-overlay"
                    data={pemukimanData}
                    style={{ color: '#0891b2', weight: 1, fillColor: '#06b6d4', fillOpacity: 0.2 }}
                  />
                )}

                {showSawah && sawahData && (
                  <GeoJSON
                    key="sawah-overlay"
                    data={sawahData}
                    style={{ color: '#059669', weight: 1, fillColor: '#34d399', fillOpacity: 0.25 }}
                  />
                )}

                {showSungai && sungaiData && (
                  <GeoJSON
                    key="sungai-overlay"
                    data={sungaiData}
                    style={{ color: '#3b82f6', weight: 2.5, opacity: 0.8 }}
                  />
                )}

                {showRelka && relkaData && (
                  <GeoJSON
                    key="relka-overlay"
                    data={relkaData}
                    style={{ color: '#64748b', weight: 2, opacity: 0.8, dashArray: '6 4' }}
                  />
                )}

                {/* ─── 2. SITEPLAN DETAIL INTERNAL (CAD/SHP GEOMETRIES) ─── */}
                {cadGeoJson && cadGeoJson.features?.length > 0 && (
                  <GeoJSON
                    key={`cad-features-${id}`}
                    data={cadGeoJson}
                    style={(feature) => {
                      const color = feature?.properties?.color ?? '#14b8a6';
                      return {
                        color,
                        weight: 1,
                        opacity: 0.9,
                        fillColor: color,
                        fillOpacity: feature?.properties?.layer_name === 'PTSP_PSU_JALAN' ? 0.35 : 0.6
                      };
                    }}
                  />
                )}

                {/* ─── 3. BATAS LUAR LAHAN (RED SOLID OUTLINE) ─── */}
                {leafletOuterCoords.length > 2 && (
                  <GeoJSON
                    key={`outer-bound-${id}`}
                    data={{
                      type: 'Feature',
                      geometry: {
                        type: 'Polygon',
                        coordinates: [submission.location.polygon.map(([a, b]) => {
                          const isLatFirst = a < 20 && b > 90;
                          return isLatFirst ? [b, a] : [a, b]; // GeoJSON format is [lng, lat]
                        })]
                      },
                      properties: {}
                    }}
                    style={{
                      color: '#ef4444',
                      weight: 2.5,
                      opacity: 1,
                      fillColor: 'transparent'
                    }}
                  />
                )}

                {/* ─── 4. TURF CLASH GEOMETRIES HIGHLIGHT (RED DASHED) ─── */}
                {spatialResult?.clashGeometry && (
                  <GeoJSON
                    key={`clash-geom-${id}`}
                    data={spatialResult.clashGeometry}
                    style={{
                      color: '#ef4444',
                      weight: 3,
                      dashArray: '5 5',
                      fillColor: '#fca5a5',
                      fillOpacity: 0.45
                    }}
                  />
                )}
              </MapContainer>

              {/* Floating Legend Box inside the map container */}
              <div className="absolute bottom-3 left-3 bg-white/95 border border-border p-3 space-y-1.5 shadow-md text-[10px] text-left max-w-[200px] z-[500] pointer-events-none select-none rounded-none">
                <span className="font-bold text-slate-800 uppercase block tracking-wider mb-1">Legenda Peta</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-5 bg-transparent border-t-[2.5px] border-[#ef4444]" />
                  <span className="font-medium text-slate-600">Batas Luar Lahan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-[#475569] border border-slate-500" />
                  <span className="font-medium text-slate-600">Kavling Bangunan (KDB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-[#10b981] border border-emerald-600" />
                  <span className="font-medium text-slate-600">Ruang Terbuka Hijau (KDH)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-[#cbd5e1] border border-slate-400" />
                  <span className="font-medium text-slate-600">Jalan & Saluran</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-[#eab308] border border-amber-600" />
                  <span className="font-medium text-slate-600">Fasos Pemakaman</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-[#14b8a6] border border-teal-600" />
                  <span className="font-medium text-slate-600">PSU / Fasum Lain</span>
                </div>
                {spatialResult?.clashGeometry && (
                  <div className="flex items-center gap-2 border-t border-border pt-1 mt-1">
                    <div className="h-3 w-3 bg-[#fca5a5] border border-rose-500 border-dashed" />
                    <span className="font-bold text-rose-600">Lahan Tabrakan Spasial</span>
                  </div>
                )}
              </div>
            </div>

            {/* Checkboxes Overlay Toggles */}
            <div className="mt-4 pt-3 border-t border-border/80 flex flex-wrap gap-x-5 gap-y-2 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">
                Tampilkan Overlay Spasial:
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSungai}
                  onChange={(e) => setShowSungai(e.target.checked)}
                  className="accent-primary cursor-pointer h-3.5 w-3.5 rounded-none"
                />
                <span className="font-semibold text-slate-600">Sempadan Sungai (25m)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRelka}
                  onChange={(e) => setShowRelka(e.target.checked)}
                  className="accent-primary cursor-pointer h-3.5 w-3.5 rounded-none"
                />
                <span className="font-semibold text-slate-600">Sempadan Rel KA (20m)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSawah}
                  onChange={(e) => setShowSawah(e.target.checked)}
                  className="accent-primary cursor-pointer h-3.5 w-3.5 rounded-none"
                />
                <span className="font-semibold text-slate-600">Sawah Dilindungi (LSD)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPemukiman}
                  onChange={(e) => setShowPemukiman(e.target.checked)}
                  className="accent-primary cursor-pointer h-3.5 w-3.5 rounded-none"
                />
                <span className="font-semibold text-slate-600">Zona Pemukiman RDTR</span>
              </label>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
