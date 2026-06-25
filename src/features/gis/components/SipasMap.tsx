import { useEffect, useMemo, useState, useRef } from 'react';
import {
    MapContainer,
    TileLayer,
    Polygon,
    Popup,
    GeoJSON,
    useMap,
    useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import { mockSubmissions } from '@/mock/submission/submissions';
import type { Submission } from '@/features/submission/types';

// Bypass TS errors
// @ts-ignore
import * as turf from '@turf/turf';

// Custom styled cluster icon
const createClusterIcon = (cluster: L.MarkerCluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? 36 : count < 50 ? 44 : 52;
    return L.divIcon({
        html: `<div style="
            width:${size}px;height:${size}px;
            background:linear-gradient(135deg,#0f766e,#14b8a6);
            border:3px solid #fff;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:${size < 44 ? 12 : 14}px;
            font-weight:900;
            color:#fff;
            box-shadow:0 2px 12px rgba(20,184,166,0.5);
            font-family:sans-serif;
        ">${count}</div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const customMarkerIcon = (color: string) => L.divIcon({
    html: `<div style="
        width:28px;height:28px;
        background:${color};
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
});

const BOGOR_CENTER: [number, number] = [-6.4816, 106.8560];

function MapController() {
    const map = useMap();
    const { setMapCenter, setMapZoom } = useGisUIStore();

    useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            setMapCenter([center.lat, center.lng]);
            window.dispatchEvent(new Event('map-move-end'));
        },
        movestart: () => {
            window.dispatchEvent(new Event('map-move-start'));
        },
        zoomend: () => {
            setMapZoom(map.getZoom());
        }
    });

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(BOGOR_CENTER, 11, { animate: true });

        const handleFlyToCoords = (e: Event) => {
            const customEvent = e as CustomEvent<{ lat: number; lng: number }>;
            if (customEvent.detail) {
                const { lat, lng } = customEvent.detail;
                map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
            }
        };

        window.addEventListener('map-zoom-in', handleZoomIn);
        window.addEventListener('map-zoom-out', handleZoomOut);
        window.addEventListener('map-reset-view', handleResetView);
        window.addEventListener('map-fly-to-coords', handleFlyToCoords);

        return () => {
            window.removeEventListener('map-zoom-in', handleZoomIn);
            window.removeEventListener('map-zoom-out', handleZoomOut);
            window.removeEventListener('map-reset-view', handleResetView);
            window.removeEventListener('map-fly-to-coords', handleFlyToCoords);
        };
    }, [map]);

    return null;
}

export default function SipasMap() {
    const {
        activeLayers,
        activeBaseMap,
        mapOpacity,
        selectedCompanyId,
        setSelectedCompanyId,
        openPanel,
        closePanelsToTheRight,
        mapZoom
    } = useGisUIStore();

    const [sungaiData, setSungaiData] = useState<any>(null);
    const [konturData, setKonturData] = useState<any>(null);
    const [pemukimanData, setPemukimanData] = useState<any>(null);
    const [isMoving, setIsMoving] = useState(false);
    
    // Clash Polygon from the hook events
    const [clashPolygons, setClashPolygons] = useState<[number, number][][]>([]);

    useEffect(() => {
        const handleMoveStart = () => setIsMoving(true);
        const handleMoveEnd = () => setIsMoving(false);
        
        const handleRenderClash = (e: Event) => {
            const ev = e as CustomEvent;
            if (ev.detail && ev.detail.clashGeometry) {
                const geom = ev.detail.clashGeometry;
                let coords: [number, number][][] = [];
                
                if (geom.geometry) {
                    const type = geom.geometry.type;
                    if (type === 'Polygon') {
                        const poly = geom.geometry.coordinates[0].map((c: any) => [c[1], c[0]]);
                        coords.push(poly);
                    } else if (type === 'MultiPolygon') {
                        geom.geometry.coordinates.forEach((polygon: any) => {
                            const poly = polygon[0].map((c: any) => [c[1], c[0]]);
                            coords.push(poly);
                        });
                    }
                }
                setClashPolygons(coords);
            }
        };

        const handleClearClash = () => {
            setClashPolygons([]);
        };

        window.addEventListener('map-move-start', handleMoveStart);
        window.addEventListener('map-move-end', handleMoveEnd);
        window.addEventListener('map-render-clash', handleRenderClash);
        window.addEventListener('map-clear-clash', handleClearClash);

        return () => {
            window.removeEventListener('map-move-start', handleMoveStart);
            window.removeEventListener('map-move-end', handleMoveEnd);
            window.removeEventListener('map-render-clash', handleRenderClash);
            window.removeEventListener('map-clear-clash', handleClearClash);
        };
    }, []);

    useEffect(() => {
        if (activeLayers.includes('layer-river') && mapZoom >= 10 && !sungaiData) {
            import('@/assets/geojson/bogor/SUNGAI_LN_25K.json')
                .then((module) => setSungaiData(module.default))
                .catch((err) => console.error(err));
        }
        if (activeLayers.includes('layer-kontur') && mapZoom >= 10 && !konturData) {
            import('@/assets/geojson/bogor/KONTUR_LN_25K.json')
                .then((module) => setKonturData(module.default))
                .catch((err) => console.error(err));
        }
        if (activeLayers.includes('layer-aqi') && mapZoom >= 10 && !pemukimanData) {
            import('@/assets/geojson/bogor/PEMUKIMAN_AR_25K.json')
                .then((module) => setPemukimanData(module.default))
                .catch((err) => console.error(err));
        }
    }, [activeLayers, mapZoom, sungaiData, konturData, pemukimanData]);

    const getTileUrl = () => {
        switch (activeBaseMap) {
            case 'dark': return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
            case 'satellite': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'street': return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
            case 'voyager': return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
            default: return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        }
    };

    const processedSubmissions = useMemo(() => {
        return mockSubmissions
            .map((sub: Submission) => {
                let categoryLayer = 'layer-siteplan';
                if (sub.landArea > 100000) categoryLayer = 'layer-masterplan';
                else if (sub.landArea < 10000) categoryLayer = 'layer-gs';

                let color = '#3b82f6';
                if (sub.status === 'Disetujui') color = '#10b981';
                else if (sub.status === 'Ditolak') color = '#ef4444';
                else if (sub.status === 'Verifikasi Teknis') color = '#6366f1';
                else if (sub.status === 'Verifikasi Administrasi') color = '#3b82f6';
                else if (sub.status === 'Menunggu Verifikasi') color = '#f59e0b';

                return { ...sub, color, categoryLayer, polygon: sub.location.polygon || [] };
            })
            .filter(sub => activeLayers.includes(sub.categoryLayer));
    }, [activeLayers]);

    const handleMarkerClick = (sub: any, map?: L.Map) => {
        if (map) map.flyTo([sub.location.lat, sub.location.lng], 16, { animate: true, duration: 1.2 });
        setSelectedCompanyId(sub.id);
        closePanelsToTheRight(-1);
        openPanel('detil-perusahaan', 'Detail Pengajuan', sub);
    };

    // ── MARKER CLUSTER LAYER (injected imperatively into Leaflet) ──────────────
    function ClusterLayer({ submissions }: { submissions: typeof processedSubmissions }) {
        const map = useMap();
        const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

        useEffect(() => {
            // @ts-ignore
            const cluster: L.MarkerClusterGroup = (L as any).markerClusterGroup({
                iconCreateFunction: createClusterIcon,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                disableClusteringAtZoom: 13, // below 13 → cluster, at 13+ → individual markers or polygons
                maxClusterRadius: 80,
                animate: true,
            });

            submissions.forEach(sub => {
                const marker = L.marker([sub.location.lat, sub.location.lng], {
                    icon: customMarkerIcon(sub.color),
                });

                marker.bindPopup(`
                    <div style="padding:6px;min-width:180px;">
                        <div style="font-weight:900;font-size:13px;color:#0f172a;margin-bottom:4px;">${sub.housingName}</div>
                        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${sub.developerName}</div>
                        <span style="font-size:10px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:0.05em;">${sub.status}</span>
                    </div>
                `);

                marker.on('click', () => handleMarkerClick(sub, map));
                cluster.addLayer(marker);
            });

            map.addLayer(cluster);
            clusterRef.current = cluster;

            return () => {
                map.removeLayer(cluster);
                cluster.clearLayers();
            };
        }, [submissions, map]); // eslint-disable-line react-hooks/exhaustive-deps

        return null;
    }

    return (
        <div className="absolute inset-0 z-0 bg-slate-100">
            <MapContainer center={BOGOR_CENTER} zoom={mapZoom} zoomControl={false} className="w-full h-full" preferCanvas={true}>
                <MapController />
                <TileLayer url={getTileUrl()} />

                {/* LOD: Peta Zonasi Pemukiman RTRW (Zoom >= 10) */}
                {!isMoving && activeLayers.includes('layer-aqi') && mapZoom >= 10 && mapZoom < 14 && pemukimanData && (
                    <GeoJSON
                        data={pemukimanData}
                        style={() => ({ color: "#2dd4bf", fillColor: "#2dd4bf", fillOpacity: 0.35 * (mapOpacity / 100), weight: 1.5, interactive: false })}
                    />
                )}

                {/* LOD: Peta Kontur Lereng (Zoom >= 10) */}
                {!isMoving && activeLayers.includes('layer-kontur') && mapZoom >= 10 && konturData && (
                    <GeoJSON
                        data={konturData}
                        style={() => ({ color: "#fcd34d", weight: 1.5, opacity: 0.8 * (mapOpacity / 100), interactive: false })}
                    />
                )}

                {/* LOD: Peta Aliran Sungai Utama (Zoom >= 10) */}
                {!isMoving && activeLayers.includes('layer-river') && mapZoom >= 10 && sungaiData && (
                    <GeoJSON
                        data={sungaiData}
                        style={() => ({ color: "#22d3ee", weight: 3, opacity: 0.9 * (mapOpacity / 100), interactive: false })}
                    />
                )}

                {/* ── Zoom < 13: Clustered Markers ──────────────────────── */}
                {mapZoom < 13 && (
                    <ClusterLayer submissions={processedSubmissions} />
                )}

                {/* ── Zoom 13–13: Simple polygons (overview) ────────────── */}
                {mapZoom >= 13 && mapZoom < 14 && processedSubmissions.map((sub) => {
                    const isSelected = selectedCompanyId === sub.id;
                    if (sub.polygon.length === 0) return null;
                    return (
                        <Polygon
                            key={`poly-${sub.id}`}
                            positions={sub.polygon as [number, number][]}
                            pathOptions={{
                                color: isSelected ? '#14b8a6' : sub.color,
                                fillColor: sub.color,
                                fillOpacity: isSelected ? 0.5 : (0.3 * (mapOpacity / 100)),
                                weight: isSelected ? 3 : 2
                            }}
                            eventHandlers={{ click: () => handleMarkerClick(sub) }}
                        />
                    );
                })}

                {/* ── Zoom >= 14: Detail CAD view ───────────────────────── */}
                {mapZoom >= 14 && processedSubmissions.map((sub) => {
                    const isSelected = selectedCompanyId === sub.id;
                    return (
                        <div key={`cad-${sub.id}`}>
                            <Polygon
                                positions={sub.polygon as [number, number][]}
                                pathOptions={{ color: isSelected ? '#14b8a6' : sub.color, fillColor: sub.color, fillOpacity: 0.25 * (mapOpacity / 100), weight: isSelected ? 4 : 2 }}
                                eventHandlers={{ click: () => handleMarkerClick(sub) }}
                            />

                            {sub.location.roadPolygons?.map((road, idx) => (
                                <Polygon key={`road-${idx}`} positions={road as [number, number][]} pathOptions={{ color: '#cbd5e1', fillColor: '#cbd5e1', fillOpacity: 0.8, weight: 1 }} />
                            ))}
                            {sub.location.rthPolygons?.map((rth, idx) => (
                                <Polygon key={`rth-${idx}`} positions={rth as [number, number][]} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.6, weight: 1 }} />
                            ))}
                            {sub.location.psuPolygons?.map((psu, idx) => (
                                <Polygon key={`psu-${idx}`} positions={psu as [number, number][]} pathOptions={{ color: '#14b8a6', fillColor: '#14b8a6', fillOpacity: 0.6, weight: 1 }} />
                            ))}
                            {sub.location.kavlingPolygons?.map((kav, idx) => (
                                <Polygon key={`kav-${idx}`} positions={kav as [number, number][]} pathOptions={{ color: '#475569', fillColor: '#64748b', fillOpacity: 0.5, weight: 1 }} />
                            ))}

                            {isSelected && clashPolygons.map((polyCoords, i) => (
                                <Polygon
                                    key={`clash-${i}`}
                                    positions={polyCoords}
                                    pathOptions={{ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.6, weight: 3, dashArray: '4, 4' }}
                                >
                                    <Popup><span className="text-xs font-black text-rose-700">Area Melanggar Sempadan!</span></Popup>
                                </Polygon>
                            ))}
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
}