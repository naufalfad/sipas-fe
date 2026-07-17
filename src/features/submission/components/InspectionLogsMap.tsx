/**
 * InspectionLogsMap.tsx (REVISED v1.2)
 * Komponen Pure Fabrication Geospasial untuk visualisasi spasial log sidak.
 * Menampilkan poligon batas lahan dan sebaran pin koordinat geotagged petugas.
 */

import { useEffect, useMemo, Fragment, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, Polyline, CircleMarker, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '@/config';

const parseUTCDateTime = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanStr = (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(cleanStr);
};

interface InspectionLogsMapProps {
    polygon?: [number, number][]; // Koordinat batas lahan rencana
    logs: any[];                  // Array data log sidak lapangan
    focusedCoords: [number, number] | null; // Titik koordinat target fokus
    onFocusReset: () => void;     // Callback reset koordinat setelah flyTo selesai
    submissionId?: string;        // ID permohonan untuk mengambil CAD GeoJSON
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

/**
 * Controller internal untuk mengendalikan behavior kamera peta Leaflet (Bounds & flyTo)
 */
function MapController({ polygon, focusedCoords, onFocusReset }: {
    polygon?: [number, number][];
    focusedCoords: [number, number] | null;
    onFocusReset: () => void;
}) {
    const map = useMap();

    // 1. Secara reaktif menyesuaikan zoom/bounds kamera mengikuti batas poligon lahan rencana
    useEffect(() => {
        if (polygon && polygon.length > 2) {
            try {
                // Parsing koordinat untuk mengamankan letak Latitude dan Longitude
                const leafletPolygon = polygon.map(([a, b]) => {
                    const isLatFirst = a < 20 && b > 90;
                    return (isLatFirst ? [a, b] : [b, a]) as [number, number];
                });

                const bounds = L.latLngBounds(leafletPolygon);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [40, 40],
                        animate: true,
                        duration: 1.2
                    });
                }
            } catch (err) {
                console.warn('[InspectionLogsMap] Gagal menyelaraskan batas poligon lahan:', err);
            }
        }
    }, [map, polygon]);

    // 2. Menangani animasi pemfokusan (flyTo) kamera ke pin spesifik yang dipilih pimpinan
    useEffect(() => {
        if (focusedCoords) {
            map.flyTo(focusedCoords, 18, {
                animate: true,
                duration: 1.5
            });
            // Beritahu parent component bahwa tugas pemfokusan selesai dilakukan
            onFocusReset();
        }
    }, [map, focusedCoords, onFocusReset]);

    return null;
}

export function InspectionLogsMap({ polygon, logs, focusedCoords, onFocusReset, submissionId }: InspectionLogsMapProps) {
    const spiderfiedLogs = useMemo(() => getSpiderfiedLogs(logs), [logs]);
    const [cadGeoJson, setCadGeoJson] = useState<any>(null);

    useEffect(() => {
        if (!submissionId) return;
        const token = sessionStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}/geojson`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => setCadGeoJson(data))
            .catch(err => console.error('[InspectionLogsMap] Gagal memuat CAD GeoJSON:', err));
    }, [submissionId]);

    // Memproses konversi koordinat poligon agar siap dibaca oleh struktur Leaflet [lat, lng]
    const parsedPolygonCoords = useMemo<[number, number][]>(() => {
        if (!polygon || polygon.length === 0) return [];
        return polygon.map(([a, b]) => {
            const isLatFirst = a < 20 && b > 90;
            return (isLatFirst ? [a, b] : [b, a]) as [number, number];
        });
    }, [polygon]);

    // Default center kamera jika poligon atau log kosong
    const defaultCenter: [number, number] = useMemo(() => {
        if (parsedPolygonCoords.length > 0) {
            return parsedPolygonCoords[0];
        }
        return [-6.4816, 106.8560]; // Koordinat pusat default Kabupaten Bogor
    }, [parsedPolygonCoords]);

    /**
     * Generasi icon pin kustom dinamis untuk menghindari issue missing assets Leaflet
     * Hijau (Teal) untuk lokasi presisi, Merah (Rose) jika terdeteksi fraud/di luar jangkauan lahan
     */
    const getCustomMarkerIcon = (index: number, isVerified: boolean) => {
        const markerColor = isVerified ? '#0d9488' : '#e11d48'; // Teal vs Rose
        const shadowColor = isVerified ? 'rgba(13,148,136,0.35)' : 'rgba(225,29,72,0.35)';

        return L.divIcon({
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 28],   // Jangkar pin bertumpu di bagian bawah tengah
            popupAnchor: [0, -28],  // Balon informasi terbuka tepat di atas kepala pin
            html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
          <!-- Ekor Pin Penunjuk -->
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
          <!-- Kepala Bulat Pin bertuliskan nomor indeks log -->
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
            ${index}
          </div>
        </div>
      `
        });
    };

    return (
        <div className="w-full h-full relative" style={{ minHeight: '100%' }}>
            <MapContainer
                center={defaultCenter}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full"
                zoomControl={true}
            >
                {/* Peta Dasar Standard Light untuk kontras tinggi */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
                    url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 1. Render Poligon Batas Lahan Perumahan */}
                {parsedPolygonCoords.length > 2 && (
                    <Polygon
                        positions={parsedPolygonCoords}
                        pathOptions={{
                            color: '#3b82f6',        // Batas biru tegas
                            weight: 2.5,
                            dashArray: '5, 5',       // Garis putus-putus
                            fillColor: '#60a5fa',
                            fillOpacity: 0.08        // Transparansi bidang dalam lahan
                        }}
                    />
                )}

                 {/* 1.5. Render Site Plan Vectors */}
                {cadGeoJson && cadGeoJson.features?.length > 0 && (
                  <GeoJSON
                    key={`cad-features-${submissionId}-${cadGeoJson.features.length}`}
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

                {/* 2. Render Pin-Pin Koordinat Log Hasil Sidak (Spiderfied) */}
                {(() => {
                    const renderedCenters = new Set<string>();
                    return spiderfiedLogs.map(({ log, renderPos, originalPos, isSpiderfied, index }) => {
                        const logPos = renderPos;
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
                                    icon={getCustomMarkerIcon(index + 1, !!log.isVerified)}
                                >
                                    <Popup>
                                        <div className="p-1 space-y-1.5 text-xs text-slate-800 text-left" style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-extrabold text-[11px] text-slate-900 uppercase">Sidak #{index + 1}</span>
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
                                                    <img src={log.photoUrl} alt={`Foto Sidak #${index + 1}`} className="w-full h-full object-cover" />
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

                {/* 3. Controller untuk mengatur behavior dan focus kamera Leaflet */}
                <MapController
                    polygon={polygon}
                    focusedCoords={focusedCoords}
                    onFocusReset={onFocusReset}
                />
            </MapContainer>
        </div>
    );
}