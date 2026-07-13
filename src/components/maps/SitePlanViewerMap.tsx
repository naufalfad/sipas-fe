import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE_URL } from '@/config';
import { Loader2, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface SitePlanViewerMapProps {
    idPermohonan: string;
    center?: [number, number]; // Fallback pusat [latitude, longitude] jika data kosong
    zoom?: number;             // Fallback zoom level
    className?: string;        // Opsi kustomisasi class Tailwind CSS
}

// ─── INNER COMPONENT: MAP CONTROLLER (AUTO FITBOUNDS) ──────────────────────────

interface MapControllerProps {
    bounds: L.LatLngBounds | null;
}

function MapController({ bounds }: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        // Memaksa Leaflet melakukan kalkulasi ulang container ukuran peta
        // untuk mencegah bug visual abu-abu (grey tile bug) di browser
        map.invalidateSize();

        if (bounds) {
            map.fitBounds(bounds, {
                padding: [30, 30],
                animate: true,
                duration: 1.5, // Transisi kamera melayang secara halus selama 1.5 detik
            });
        }
    }, [map, bounds]);

    return null;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function SitePlanViewerMap({
    idPermohonan,
    center = [-6.4816, 106.8560], // Default pusat wilayah Kabupaten Bogor
    zoom = 14,
    className = "w-full h-full border border-border"
}: SitePlanViewerMapProps) {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch GeoJSON murni langsung dari API backend yang ter-optimize
    useEffect(() => {
        let isMounted = true;

        const fetchGeoJson = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/v1/submissions/${idPermohonan}/geojson`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });

                if (!response.ok) {
                    throw new Error(`Gagal memuat visual spasial (HTTP ${response.status})`);
                }

                const data = await response.json();

                if (isMounted) {
                    setGeoJsonData(data);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Terjadi kesalahan saat memproses data spasial.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchGeoJson();

        return () => {
            isMounted = false;
        };
    }, [idPermohonan]);

    // Kalkulasi dinamis bounds spasial agar peta otomatis melakukan fitBounds ke seluruh isi gambar CAD
    const computedBounds = useMemo(() => {
        if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) return null;
        try {
            const geojsonLayer = L.geoJSON(geoJsonData);
            const bounds = geojsonLayer.getBounds();
            return bounds.isValid() ? bounds : null;
        } catch {
            return null;
        }
    }, [geoJsonData]);

    // ─── AUDIT: HANDLER PENGATUR GAYA VISUAL MULTI-WARNA DEFENSIF (ANTI-GREY-OUT) ───
    // Membaca warna deklaratif database dengan fallback penentuan warna presisi di frontend
    const getFeatureStyle = (feature: any) => {
        const props = feature?.properties || {};
        const layerName = props.layer_name ? props.layer_name.toUpperCase() : '';

        // Prioritaskan warna murni dari PostGIS, jika kosong gunakan pemetaan terstandar
        let color = props.color;
        if (!color) {
            if (layerName === 'PTSP_KDB') {
                color = '#475569';      // Slate tebal untuk kaveling
            } else if (layerName === 'PTSP_PSU_JALAN') {
                color = '#cbd5e1';      // Slate ringan untuk as jalan utama/lokal
            } else if (layerName === 'PTSP_KDH') {
                color = '#10b981';      // Emerald hijau untuk area terbuka hijau (RTH)
            } else if (layerName === 'PTSP_PSU_MAKAM') {
                color = '#eab308';      // Amber kuning untuk pemakaman
            } else {
                color = '#14b8a6';      // Teal untuk PSU lainnya
            }
        }

        // Tentukan opasitas pengisian bidang poligon
        let fillOpacity = props.fillOpacity;
        if (fillOpacity === undefined || fillOpacity === null) {
            fillOpacity = (layerName === 'PTSP_PSU_JALAN') ? 0.45 : 0.65;
        }

        return {
            color: color,
            weight: layerName === 'PTSP_PSU_JALAN' ? 1.5 : 1,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: fillOpacity,
        };
    };

    // Handler pop-up interaktif saat kaveling/jalan di peta di-klik
    const onEachFeature = (feature: any, layer: L.Layer) => {
        const props = feature?.properties || {};
        if (props.layer_name) {
            // Normalisasi label display
            const label = props.layer_name.replace('PTSP_', '').replace('_', ' ');
            layer.bindPopup(`
                <div style="font-family: sans-serif; font-size: 11px; padding: 4px; text-align: left;">
                    <strong style="color: #415D43; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px;">
                        Layer: ${label}
                    </strong>
                    <span style="color: #475569;">Batas geometris organik terkalibrasi secara presisi.</span>
                </div>
            `, {
                closeButton: false,
                offset: [0, -5]
            });
        }
    };

    return (
        <div className={cn("relative overflow-hidden rounded-none", className)} style={{ width: '100%', height: '100%' }}>

            {/* 1. SAGE GREEN LOADING SPINNER OVERLAY */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center space-y-2 select-none">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse leading-none">
                        Memetakan Batas Lahan...
                    </span>
                </div>
            )}

            {/* 2. ERROR WARNING OVERLAY */}
            {error && (
                <div className="absolute inset-0 bg-rose-50/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
                    <div className="p-3 bg-rose-100/50 border border-rose-200">
                        <AlertTriangle className="h-6 w-6 text-rose-600 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block leading-none">Kegagalan Spasial</span>
                        <p className="text-[10.5px] text-rose-600 leading-relaxed max-w-xs mx-auto text-justify">{error}</p>
                    </div>
                </div>
            )}

            {/* 3. FLOATING HUD LEGEND */}
            {!isLoading && !error && geoJsonData && geoJsonData.features?.length > 0 && (
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur border border-border p-3 shadow-md select-none text-left rounded-none">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-2">
                        <Layers size={10} className="text-primary" /> Legenda Rencana Tapak
                    </span>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[9px] font-bold text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-3.5 bg-[#475569] border border-white block shrink-0"></span>
                            Kaveling Unit (KDB)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-3.5 bg-[#cbd5e1] border border-white block shrink-0"></span>
                            Jalan Utama (ROW)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-3.5 bg-[#10b981] border border-white block shrink-0"></span>
                            Hijau/Taman (RTH)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-3.5 bg-[#eab308] border border-white block shrink-0"></span>
                            Pemakaman (TPU 2%)
                        </div>
                    </div>
                </div>
            )}

            {/* 4. THE LEAFLET MAP CONTAINER */}
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={false}
                className="w-full h-full"
                zoomControl={false}
                // OPTIMASI VITAL: Paksa Leaflet menggunakan HTML5 Canvas Renderer (Bukan SVG)
                // Mencegah memory bloat DOM saat merender ratusan kaveling tidak beraturan
                preferCanvas={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render Layer GeoJSON Tunggal yang Stabil */}
                {geoJsonData && (
                    <GeoJSON
                        // SINKRONISASI BINDING KEY: Memaksa penggambaran ulang penuh saat permohonan berganti
                        key={`${idPermohonan}-${geoJsonData.features?.length || 0}`}
                        data={geoJsonData}
                        style={getFeatureStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Kontrol Auto Focus Kamera Spasial */}
                <MapController bounds={computedBounds} />
            </MapContainer>
        </div>
    );
}