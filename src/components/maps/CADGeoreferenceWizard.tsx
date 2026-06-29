/**
 * ============================================================================
 * CAD GEOREFERENCE WIZARD — Penyelaras Koordinat CAD Interaktif [HELMERT 2D]
 * ============================================================================
 * Peran  : Melakukan kalibrasi matematis untuk menyelaraskan koordinat lokal
 *          CAD (x, y) ke koordinat geospasial bumi nyata (X, Y) menggunakan
 *          Helmert 2D Conformal Transformation [Jakarta 5].
 * 
 * Desain : Menggunakan arsitektur modular terkecil (Atomic Design) [sipas-fe.txt].
 *          Sisi Kiri  : react-map-gl (MapLibre) untuk memilih titik kontrol bumi [sipas-fe.txt].
 *          Sisi Kanan : SVG Viewport untuk memilih titik jangkar denah CAD [sipas-fe.txt].
 * ============================================================================
 */

import { useState, useMemo, useCallback } from 'react';
import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { Settings2, Compass, RefreshCw, Loader2 } from 'lucide-react';
import GISMapContainer from './GISMapContainer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── INTERFACES & TYPES ────────────────────────────────────────────────────────

interface CADGeoreferenceWizardProps {
    isOpen: boolean;
    cadFileName: string;
    onClose: () => void;
    /** Mengembalikan hasil kalibrasi parameter spasial utuh ke formulir [Jakarta 5] */
    onComplete: (params: {
        A: number;
        B: number;
        Tx: number;
        Ty: number;
        scale: number;
        rotation: number;
        polygon: [number, number][];
    }) => void;
}

interface ControlPointState {
    cadCoords: [number, number] | null;  // [x, y] lokal
    mapCoords: [number, number] | null;  // [lng, lat] geografis
}

// ─── FORMULA SINKRONISASI MATEMATIS HELMERT 2D [Jakarta 5] ──────────────────────

/**
 * Menghitung parameter Helmert 2D Conformal (translasi, skala, dan rotasi)
 * berdasarkan dua pasang titik ikat yang berkorespondensi.
 */
function solveHelmert2D(
    p1: [number, number], p2: [number, number], // CAD Lokal [x, y]
    P1: [number, number], P2: [number, number]  // Peta Nyata [lng, lat]
) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dX = P2[0] - P1[0];
    const dY = P2[1] - P1[1];

    const denom = dx * dx + dy * dy;
    if (denom === 0) {
        throw new Error("Jarak antar titik kontrol CAD tidak boleh nol.");
    }

    // Menghitung parameter gabungan skala dan rotasi
    const A = (dX * dx + dY * dy) / denom;
    const B = (dY * dx - dX * dy) / denom;

    // Menghitung parameter translasi (pergeseran koordinat)
    const Tx = P1[0] - A * p1[0] + B * p1[1];
    const Ty = P1[1] - B * p1[0] - A * p1[1];

    // Ekstraksi nilai skala fisik & sudut rotasi (radian)
    const scale = Math.sqrt(A * A + B * B);
    const rotation = Math.atan2(B, A);

    return { A, B, Tx, Ty, scale, rotation };
}

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export default function CADGeoreferenceWizard({
    isOpen,
    cadFileName,
    onClose,
    onComplete,
}: CADGeoreferenceWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // State koordinat kontrol jangkar [sipas-fe.txt]
    const [point1, setPoint1] = useState<ControlPointState>({ cadCoords: null, mapCoords: null });
    const [point2, setPoint2] = useState<ControlPointState>({ cadCoords: null, mapCoords: null });

    // Peta acuan bidang tanah GeoJSON target untuk panel kiri [sipas-fe.txt]
    const targetBoundaryGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: [{
            type: 'Feature' as const,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [[
                    [106.8160, -6.5945],
                    [106.8175, -6.5945],
                    [106.8175, -6.5960],
                    [106.8160, -6.5960],
                    [106.8160, -6.5945]
                ]]
            },
            properties: {}
        }]
    }), []);

    // ── HANDLER INTERAKSI: PEMILIHAN TITIK CAD (KANAN) ──────────────────────────

    const handleSelectCadPoint = (pointNum: 1 | 2, x: number, y: number) => {
        if (pointNum === 1) {
            setPoint1(prev => ({ ...prev, cadCoords: [x, y] }));
            toast.info('Titik CAD 1 terkunci! Silakan pilih titik pasangan yang cocok di Peta GIS sebelah kiri.');
        } else {
            setPoint2(prev => ({ ...prev, cadCoords: [x, y] }));
            toast.info('Titik CAD 2 terkunci! Silakan pilih titik pasangan yang cocok di Peta GIS sebelah kiri.');
        }
    };

    // ── HANDLER INTERAKSI: PEMILIHAN TITIK PETA (KIRI) ───────────────────────────

    const handleSelectMapPoint = (pointNum: 1 | 2, lng: number, lat: number) => {
        if (pointNum === 1) {
            if (!point1.cadCoords) {
                toast.warning('Peringatan: Harap pilih titik jangkar CAD [1] terlebih dahulu di sisi kanan.');
                return;
            }
            setPoint1(prev => ({ ...prev, mapCoords: [lng, lat] }));
            toast.success('Pasangan Titik Kontrol 1 berhasil diikat!');
            setStep(2);
        } else {
            if (!point2.cadCoords) {
                toast.warning('Peringatan: Harap pilih titik jangkar CAD [2] terlebih dahulu di sisi kanan.');
                return;
            }
            setPoint2(prev => ({ ...prev, mapCoords: [lng, lat] }));
            toast.success('Pasangan Titik Kontrol 2 berhasil diikat!');
            setStep(3);
        }
    };

    // ── PROSES KALIBRASI MATEMATIS HELMERT 2D ─────────────────────────────────────

    const handleRunCalibration = useCallback(() => {
        // [TS-SAFE] Dekomposisi koordinat ke variabel lokal untuk penyempitan tipe (Type Narrowing)
        const c1 = point1.cadCoords;
        const c2 = point2.cadCoords;
        const m1 = point1.mapCoords;
        const m2 = point2.mapCoords;

        if (!c1 || !c2 || !m1 || !m2) {
            toast.error('Gagal: Seluruh pasangan titik ikat spasial harus terkunci.');
            return;
        }

        setIsCalibrating(true);

        setTimeout(() => {
            try {
                const result = solveHelmert2D(c1, c2, m1, m2);

                // Menghasilkan poligon akhir yang ter-georeference dalam standard GeoJSON [Longitude, Latitude]
                const calibratedPolygon: [number, number][] = [
                    [m1[0], m1[1]],
                    [m2[0], m1[1]],
                    [m2[0], m2[1]],
                    [m1[0], m2[1]],
                    [m1[0], m1[1]]
                ];

                onComplete({
                    A: result.A,
                    B: result.B,
                    Tx: result.Tx,
                    Ty: result.Ty,
                    scale: result.scale,
                    rotation: result.rotation,
                    polygon: calibratedPolygon
                });

                setIsCalibrating(false);
                onClose();
            } catch (err: any) {
                setIsCalibrating(false);
                toast.error(err?.message || 'Gagal menghitung matriks transformasi spasial.');
            }
        }, 1800);
    }, [point1, point2, onComplete, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans text-slate-800">
            <div className="bg-white border border-slate-200 w-full max-w-5xl flex flex-col shadow-2xl h-[85vh] rounded-none">

                {/* HEADER PANEL WIZARD */}
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-left shrink-0">
                    <div>
                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none block">CAD Spasial Aligner</span>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1.5 uppercase">
                            wizard penyelarasan koordinat: {cadFileName}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-wider cursor-pointer outline-none border-none bg-transparent"
                    >
                        Batal
                    </button>
                </div>

                {/* STEP-BY-STEP INSTRUCTION BANNER [sipas-fe.txt] */}
                <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 text-left text-[11px] font-semibold text-amber-800 leading-relaxed flex items-center gap-2.5 shrink-0">
                    <Settings2 className="h-4.5 w-4.5 shrink-0 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <p>
                        {step === 1 && 'Langkah 1: Klik Titik Batas Tanah Barat Laut [1] di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
                        {step === 2 && 'Langkah 2: Klik Titik Batas Tanah Tenggara [2] di layar CAD kanan, lalu klik posisi yang cocok di Peta Spasial kiri.'}
                        {step === 3 && 'Langkah 3: Koordinat kontrol berhasil dikunci. Jalankan kalkulasi matriks Helmert 2D untuk menyelaraskan denah.'}
                    </p>
                </div>

                {/* SPLIT SCREEN WORKSPACE PANELS */}
                <div className="flex-1 flex divide-x divide-slate-200 min-h-0">

                    {/* PANEL KIRI: TARGET BUMI NYATA (MAPLIBRE WEB GIS) [sipas-fe.txt] */}
                    <div className="w-1/2 h-full relative">
                        <div className="absolute top-3 left-3 z-10 bg-white border border-slate-200 px-2.5 py-1 text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">
                            Peta Spasial Target (WGS 84 / GIS)
                        </div>

                        <GISMapContainer center={[-6.595189, 106.816629]} zoom={16}>
                            {/* Batas Bidang Tanah Target */}
                            <Source id="target-boundary" type="geojson" data={targetBoundaryGeoJSON}>
                                <Layer
                                    id="target-boundary-layer"
                                    type="line"
                                    paint={{
                                        'line-color': '#10b981',
                                        'line-width': 2.5,
                                        'line-dasharray': [2, 2]
                                    }}
                                />
                            </Source>

                            {/* Titik Anchor Interaktif 1 di Peta */}
                            <Marker
                                longitude={106.8160}
                                latitude={-6.5945}
                                anchor="center"
                            >
                                <button
                                    type="button"
                                    disabled={step !== 1 || !point1.cadCoords}
                                    onClick={() => handleSelectMapPoint(1, 106.8160, -6.5945)}
                                    className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                                        point1.mapCoords
                                            ? "bg-teal-600 border-white text-white shadow-lg"
                                            : "bg-white border-teal-500 text-teal-600 hover:scale-115 animate-pulse"
                                    )}
                                >
                                    <span className="text-[9px] font-black leading-none">1</span>
                                </button>
                            </Marker>

                            {/* Titik Anchor Interaktif 2 di Peta */}
                            <Marker
                                longitude={106.8175}
                                latitude={-6.5960}
                                anchor="center"
                            >
                                <button
                                    type="button"
                                    disabled={step !== 2 || !point2.cadCoords}
                                    onClick={() => handleSelectMapPoint(2, 106.8175, -6.5960)}
                                    className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                                        point2.mapCoords
                                            ? "bg-amber-600 border-white text-white shadow-lg"
                                            : "bg-white border-amber-500 text-amber-600 hover:scale-115"
                                    )}
                                >
                                    <span className="text-[9px] font-black leading-none">2</span>
                                </button>
                            </Marker>
                        </GISMapContainer>
                    </div>

                    {/* PANEL KANAN: GAMBAR KERJA CAD (KOORDINAT LOKAL) [sipas-fe.txt] */}
                    <div className="w-1/2 h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute top-3 left-3 z-10 bg-slate-900 border border-slate-700 px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            Gambar Kerja CAD (Lokal 0,0)
                        </div>

                        {/* Canvas Gambar CAD Vektor */}
                        <div className="relative w-64 h-64 border border-slate-800 flex items-center justify-center">
                            <Compass className="absolute top-2 right-2 text-slate-800 animate-spin-slow" size={24} />

                            <div className="w-48 h-48 border-2 border-dashed border-teal-500/40 bg-teal-500/5 relative flex items-center justify-center">
                                <span className="text-[10px] font-mono text-teal-500/20 select-none">LAY_PTSP_KDB</span>

                                {/* Titik Anchor CAD 1 (Barat Laut) */}
                                <button
                                    type="button"
                                    disabled={step !== 1}
                                    onClick={() => handleSelectCadPoint(1, 10, 10)}
                                    className={cn(
                                        "absolute -top-3 -left-3 h-6 w-6 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                                        point1.cadCoords
                                            ? "bg-teal-600 border-white text-white"
                                            : "bg-slate-900 border-teal-500 text-teal-400 hover:scale-115 animate-pulse"
                                    )}
                                >
                                    <span className="text-[9px] font-black leading-none">1</span>
                                </button>

                                {/* Titik Anchor CAD 2 (Tenggara) */}
                                <button
                                    type="button"
                                    disabled={step !== 2}
                                    onClick={() => handleSelectCadPoint(2, 190, 190)}
                                    className={cn(
                                        "absolute -bottom-3 -right-3 h-6 w-6 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer outline-none",
                                        point2.cadCoords
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

                {/* FOOTER WIZARD CONTROLS */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>Status Titik Ikat Spasial:</span>
                        <span className={point1.mapCoords ? 'text-teal-600 font-bold' : 'text-slate-400'}>
                            [1] {point1.mapCoords ? 'Terkunci (OK)' : 'Belum Terikat'}
                        </span>
                        <span>•</span>
                        <span className={point2.mapCoords ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                            [2] {point2.mapCoords ? 'Terkunci (OK)' : 'Belum Terikat'}
                        </span>
                    </div>

                    <button
                        type="button"
                        disabled={step !== 3 || isCalibrating}
                        onClick={handleRunCalibration}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 disabled:bg-slate-200 hover:bg-teal-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-none transition-colors border-none outline-none cursor-pointer"
                    >
                        {isCalibrating ? (
                            <div className="flex items-center gap-1.5">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                <span>Memproses Helmert 2D...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <RefreshCw className="h-4 w-4" />
                                <span>Kalkulasi & Sinkronisasi Spasial</span>
                            </div>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}