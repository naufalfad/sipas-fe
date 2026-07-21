import { useMemo, useState, useEffect, Fragment } from 'react';
import { Landmark, MapPin } from 'lucide-react';
import { GeoJSON, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GISMapContainer from '@/components/maps/GISMapContainer';
import { leafletRingToGeoJSON } from '@/lib/geoUtils';
import { API_BASE_URL } from '@/config';

const parseUTCDateTime = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanStr = (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(cleanStr);
};

interface LocationTabProps {
  sub: any;
  inspectionLogs?: any[];
}

interface SpiderfiedLog {
  log: any;
  renderPos: [number, number];
  originalPos: [number, number];
  isSpiderfied: boolean;
  index: number;
}

const getSpiderfiedLogs = (logs: any[]): SpiderfiedLog[] => {
  const groups: any[][] = [];
  const distanceThreshold = 0.00018; // approx 20 meters

  logs.forEach((log) => {
    if (log.latitude === null || log.longitude === null) return;
    const lat = Number(log.latitude);
    const lng = Number(log.longitude);

    let foundGroup = false;
    for (const group of groups) {
      const baseLat = Number(group[0].latitude);
      const baseLng = Number(group[0].longitude);
      const distance = Math.sqrt(Math.pow(lat - baseLat, 2) + Math.pow(lng - baseLng, 2));
      if (distance < distanceThreshold) {
        group.push(log);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([log]);
    }
  });

  const spiderfied: SpiderfiedLog[] = [];

  groups.forEach((group) => {
    const N = group.length;
    const centerLat = Number(group[0].latitude);
    const centerLng = Number(group[0].longitude);

    if (N === 1) {
      spiderfied.push({
        log: group[0],
        renderPos: [centerLat, centerLng],
        originalPos: [centerLat, centerLng],
        isSpiderfied: false,
        index: logs.indexOf(group[0])
      });
    } else {
      const radius = 0.00020; // approx 20m radius offset
      group.forEach((log, i) => {
        const theta = (2 * Math.PI * i) / N;
        const offsetLat = Math.sin(theta) * radius;
        const offsetLng = Math.cos(theta) * radius;
        spiderfied.push({
          log,
          renderPos: [centerLat + offsetLat, centerLng + offsetLng],
          originalPos: [centerLat, centerLng],
          isSpiderfied: true,
          index: logs.indexOf(log)
        });
      });
    }
  });

  return spiderfied.sort((a, b) => a.index - b.index);
};

export const LocationTab = ({ sub, inspectionLogs = [] }: LocationTabProps) => {
  const spiderfiedLogs = useMemo(() => getSpiderfiedLogs(inspectionLogs), [inspectionLogs]);
  const [cadGeoJson, setCadGeoJson] = useState<any>(null);

  useEffect(() => {
    if (!sub?.id) return;
    const token = sessionStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/v1/submissions/${sub.id}/geojson`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCadGeoJson(data))
      .catch(err => console.error(err));
  }, [sub?.id]);

  // Memetakan batas luar bidang tanah site plan
  const outerBoundaryGeoJSON = useMemo(() => {
    if (!sub?.location?.polygon || sub.location.polygon.length === 0) return null;
    try {
      const ring = leafletRingToGeoJSON(sub.location.polygon as [number, number][]);
      return {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {}
        }]
      };
    } catch (e) {
      console.warn('[DetailMap] Gagal memetakan polygon batas luar:', e);
      return null;
    }
  }, [sub]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-200">
      {/* Kolom Kiri: Detail Textual */}
      <div className="space-y-6 text-left">
        <div>
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <Landmark className="h-4.5 w-4.5 text-primary" />
            Informasi Spasial Lahan & Kepemilikan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Lokasi Proyek</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.locationName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan Terdaftar</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.landArea ? `${sub.locationDetails.landArea.toLocaleString('id-ID')} m²` : (sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Desa / Kelurahan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.village || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kecamatan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.district || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kabupaten / Kota</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.city || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Provinsi</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.province || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat Lengkap Lahan</span>
              <span className="text-xs font-semibold text-slate-600 block">{sub.locationDetails?.fullAddress || sub.location.address}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Sertifikasi & Legalitas Tanah
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Status Kepemilikan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.ownershipStatus || 'SHM'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor Sertifikat</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.locationDetails?.certificateNumber || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Pemilik Hak Sertifikat</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.certificateOwner || '-'}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Kesesuaian Tata Ruang Otoritas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor SK KKPR BPN / Dinas</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.spatial?.kkprNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Zoning Peruntukan Rencana Tata Ruang</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.spatial?.landUse || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Alokasi PSU & RTH (m²)</span>
              <span className="text-xs font-bold text-slate-700 block">
                {sub.spatial?.greenArea ? `${sub.spatial.greenArea.toLocaleString('id-ID')} m²` : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Sistem Koordinat & Transformasi Helmert 2D
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama File CAD Asal</span>
              <span className="text-xs font-mono font-bold text-slate-700 block truncate" title={sub.coordinate?.cadFileName}>{sub.coordinate?.cadFileName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Faktor Skala Spasial (s)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadScale !== undefined ? sub.coordinate.cadScale : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Parameter Helmert A</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamA !== undefined ? sub.coordinate.cadParamA : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Parameter Helmert B</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamB !== undefined ? sub.coordinate.cadParamB : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Translasi X (Tx)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamTx !== undefined ? sub.coordinate.cadParamTx : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Translasi Y (Ty)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamTy !== undefined ? sub.coordinate.cadParamTy : '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sudut Rotasi Spasial (Radian)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadRotation !== undefined ? `${sub.coordinate.cadRotation} rad` : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Visualisasi Peta Proyeksi Spasial */}
      <div className="space-y-4 flex flex-col justify-between text-left">
        <div>
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <MapPin className="h-4.5 w-4.5 text-primary" />
            Visualisasi Proyeksi Bidang & Site Plan (SHP/CAD)
          </h3>
          <div className="h-[300px] w-full relative border border-border bg-slate-100 overflow-hidden">
            {sub.location.lat && sub.location.lng ? (
              <GISMapContainer
                center={[sub.location.lat, sub.location.lng]}
                zoom={16}
                className="w-full h-full"
              >
                {/* Render Outer Boundary */}
                {outerBoundaryGeoJSON && (
                  <GeoJSON
                    key="outer-boundary"
                    data={outerBoundaryGeoJSON}
                    style={{
                      color: '#ef4444',
                      weight: 2.5,
                      dashArray: '6 4',
                      fillColor: '#ef4444',
                      fillOpacity: 0.08,
                    }}
                  />
                )}

                {/* Render Site Plan Vectors */}
                {cadGeoJson && cadGeoJson.features?.length > 0 && (
                  <GeoJSON
                    key={`cad-features-${sub.id}-${cadGeoJson.features.length}`}
                    data={cadGeoJson}
                    style={(feature) => {
                      const color = feature?.properties?.color ?? '#14b8a6';
                      return {
                        color: color,
                        weight: 1,
                        fillColor: color,
                        fillOpacity: feature?.properties?.layer_name === 'PTSP_PSU_JALAN' ? 0.35 : 0.65
                      };
                    }}
                  />
                )}

                {/* Render Pin-Pin Koordinat Log Hasil Sidak (Spiderfied) */}
                {(() => {
                  const renderedCenters = new Set<string>();
                  return spiderfiedLogs.map(({ log, renderPos, originalPos, isSpiderfied, index }) => {
                    const logPos = renderPos;
                    const markerColor = log.isVerified ? '#0d9488' : '#e11d48'; // Teal vs Rose
                    const shadowColor = log.isVerified ? 'rgba(13,148,136,0.35)' : 'rgba(225,29,72,0.35)';

                    const customIcon = L.divIcon({
                      className: '',
                      iconSize: [28, 28],
                      iconAnchor: [14, 28],
                      popupAnchor: [0, -28],
                      html: `
                        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                          <div style="
                            position: absolute;
                            bottom: 0;
                            left: 50%;
                            transform: translateX(-50%) rotate(45deg);
                            width: 12px;
                            height: 12px;
                            background-color: ${markerColor};
                            box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
                          "></div>
                          <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            border: 2.5px solid #ffffff;
                            background-color: ${markerColor};
                            color: #ffffff;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-family: sans-serif;
                            font-size: 10px;
                            font-weight: 900;
                            box-shadow: 0 4px 10px ${shadowColor};
                          ">
                            ${index + 1}
                          </div>
                        </div>
                      `
                    });

                    const centerKey = `${originalPos[0]},${originalPos[1]}`;
                    const shouldRenderCenter = isSpiderfied && !renderedCenters.has(centerKey);
                    if (shouldRenderCenter) {
                      renderedCenters.add(centerKey);
                    }

                    return (
                      <Fragment key={log.id ?? index}>
                        {isSpiderfied && (
                          <Polyline
                            positions={[originalPos, renderPos]}
                            pathOptions={{
                              color: '#64748b',
                              weight: 1.5,
                              dashArray: '4, 4',
                              opacity: 0.7
                            }}
                          />
                        )}
                        {shouldRenderCenter && (
                          <CircleMarker
                            center={originalPos}
                            radius={4}
                            pathOptions={{
                              color: '#475569',
                              fillColor: '#94a3b8',
                              fillOpacity: 0.9,
                              weight: 1.5
                            }}
                          />
                        )}
                        <Marker
                          position={logPos}
                          icon={customIcon}
                        >
                          <Popup>
                            <div className="p-1 space-y-1.5 text-xs text-slate-800 text-left" style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-extrabold text-[11px] text-slate-900 uppercase">Verifikasi #{index + 1}</span>
                                <span
                                  className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border leading-none"
                                  style={{
                                    color: log.isVerified ? '#0f766e' : '#be123c',
                                    backgroundColor: log.isVerified ? '#f0fdfa' : '#fff1f2',
                                    borderColor: log.isVerified ? '#ccfbf1' : '#ffe4e6',
                                  }}
                                >
                                  {log.isVerified ? 'Sesuai' : 'Luar Lokasi'}
                                </span>
                              </div>

                              {log.photoUrl && (
                                <div className="w-full aspect-video overflow-hidden border border-slate-100 bg-slate-50">
                                  <img src={log.photoUrl} alt={`Foto Verifikasi #${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                              )}

                              <div className="space-y-0.5 text-[9px] text-slate-500 font-medium">
                                <p className="font-bold text-slate-700">Verifikator: {log.inspectorName || '—'}</p>
                                <p>Waktu: {log.timestamp ? parseUTCDateTime(log.timestamp).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}</p>
                                {log.distanceMeters !== null && log.distanceMeters !== undefined && (
                                  <p className="font-bold font-mono" style={{ color: log.isVerified ? '#0d9488' : '#e11d48' }}>
                                    Deviasi: {Number(log.distanceMeters).toFixed(1)}m dari batas
                                  </p>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      </Fragment>
                    );
                  });
                })()}
              </GISMapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Peta spasial tidak tersedia untuk koordinat ini.
              </div>
            )}
          </div>
        </div>

        {/* Legenda Layer */}
        <div className="bg-slate-50 border border-border p-3.5 space-y-2 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Legenda Layer Site Plan:</span>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 border border-dashed border-red-500 bg-red-500/10 block shrink-0"></span>
              Batas Lahan (Outer Boundary)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#64748b] block shrink-0"></span>
              Kaveling Unit Hunian
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#cbd5e1] block shrink-0"></span>
              Jaringan Jalan & ROW
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#10b981] block shrink-0"></span>
              RTH (Ruang Terbuka Hijau)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#14b8a6] block shrink-0"></span>
              PSU / Sarana Utilitas
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-[#0d9488] border border-white rounded-full block shrink-0 shadow-sm"></span>
              Verifikasi Lapangan (Sesuai)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-[#e11d48] border border-white rounded-full block shrink-0 shadow-sm"></span>
              Verifikasi Lapangan (Luar Lokasi)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
