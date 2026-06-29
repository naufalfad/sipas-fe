import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// @ts-ignore - Bypass issue mapping exports Turf.js v6.5 di TypeScript modern (Vite)
import * as turf from '@turf/turf';

export interface SpatialClashDetail {
    layerId: string;
    layerName: string;
    clashAreaSqm: number;
    description: string;
    severity: 'danger' | 'warning' | 'info';
    zoningNote?: string; // Penjelasan kontekstual mengapa ini melanggar/sesuai
}

export interface SpatialAuditResult {
    isClashing: boolean;
    clashGeometry: any | null;
    clashAreaSqm: number;
    details: SpatialClashDetail[];
    zoningScore: number;   // Skor kepatuhan 0–100 (100 = sempurna)
    verdict: 'LAYAK' | 'PERLU_REVISI' | 'TIDAK_LAYAK';
    error?: string;
}

// ─── MATRIKS KESESUAIAN ZONASI ─────────────────────────────────────────────────
//
// Dimensi: [Kategori Pengajuan] x [Zona Lahan yang Ditabrak]
// Nilai: 'danger' | 'warning' | 'info' | 'ok'
//
// Kategori pengajuan:
//   PERUMAHAN    = Perumahan/hunian (site plan kavling)
//   INDUSTRI     = Pabrik, gudang, kawasan industri
//   KOMERSIAL    = Pertokoan, mall, kantor, hotel
//   FASILITAS    = Fasos/Fasum: sekolah, RS, masjid, taman
//
// Zona lahan:
//   sawah        = Lahan Sawah Dilindungi (LSD) — dilindungi UU No. 41/2009
//   pasir        = Gumuk Pasir / Cagar Alam — dilindungi UU No. 5/1990
//   kebun        = Perkebunan pertanian
//   ladang       = Ladang / tegalan / pertanian kering
//   pemukiman    = Zona peruntukan pemukiman RDTR
//   sungai       = Buffer sempadan sungai 25m — PP No. 38/2011
// ──────────────────────────────────────────────────────────────────────────────

type ZonaType = 'sawah' | 'pasir' | 'kebun' | 'ladang' | 'pemukiman' | 'sungai';
type KategoriType = 'PERUMAHAN' | 'INDUSTRI' | 'KOMERSIAL' | 'FASILITAS' | string;
type SeverityLevel = 'danger' | 'warning' | 'info' | 'ok';

interface ZoningRule {
    severity: SeverityLevel;
    reason: string;
    dasar_hukum?: string;
}

const ZONING_MATRIX: Record<ZonaType, Record<string, ZoningRule>> = {
    sungai: {
        // Sempadan sungai adalah mutlak — SEMUA kategori dilarang
        _default: {
            severity: 'danger',
            reason: 'Kawasan sempadan sungai 25m adalah zona mutlak lindung. Tidak ada pembangunan apapun yang diizinkan.',
            dasar_hukum: 'PP No. 38/2011 tentang Sungai'
        }
    },
    pasir: {
        // Cagar alam / gumuk pasir — mutlak dilindungi
        _default: {
            severity: 'danger',
            reason: 'Kawasan konservasi gumuk pasir adalah cagar alam yang dilindungi mutlak.',
            dasar_hukum: 'UU No. 5/1990 tentang Konservasi Sumber Daya Alam'
        }
    },
    sawah: {
        PERUMAHAN: {
            severity: 'danger',
            reason: 'Perumahan di atas Lahan Sawah Dilindungi (LSD) dilarang keras — mengancam ketahanan pangan nasional.',
            dasar_hukum: 'UU No. 41/2009 tentang Perlindungan Lahan Pertanian Pangan Berkelanjutan'
        },
        INDUSTRI: {
            severity: 'danger',
            reason: 'Industri di atas sawah berdampak destruktif ganda: hilangnya lahan pangan + pencemaran tanah & air irigasi.',
            dasar_hukum: 'UU No. 41/2009 & UU No. 32/2009 tentang PPLH'
        },
        KOMERSIAL: {
            severity: 'danger',
            reason: 'Pembangunan komersial di atas sawah dilindungi (LSD) tidak sesuai peruntukan RTRW.',
            dasar_hukum: 'UU No. 41/2009'
        },
        FASILITAS: {
            severity: 'warning',
            reason: 'Fasos/Fasum di atas sawah memerlukan kajian KLHS dan rekomendasi BPN khusus.',
            dasar_hukum: 'UU No. 41/2009, dapat dikecualikan dengan mekanisme khusus'
        },
        _default: {
            severity: 'danger',
            reason: 'Rencana pembangunan menabrak Lahan Sawah Dilindungi (LSD).',
            dasar_hukum: 'UU No. 41/2009'
        }
    },
    kebun: {
        PERUMAHAN: {
            severity: 'warning',
            reason: 'Perumahan di zona perkebunan memerlukan izin alih fungsi lahan dari Kementerian Pertanian.',
            dasar_hukum: 'UU No. 39/2014 tentang Perkebunan'
        },
        INDUSTRI: {
            severity: 'danger',
            reason: 'Industri di zona perkebunan berisiko tinggi — pencemaran pestisida dan alih fungsi lahan masif.',
            dasar_hukum: 'UU No. 39/2014 & Permentan No. 98/2013'
        },
        KOMERSIAL: {
            severity: 'warning',
            reason: 'Pembangunan komersial di area perkebunan memerlukan perubahan RDTR dan izin alih fungsi.',
            dasar_hukum: 'UU No. 39/2014'
        },
        FASILITAS: {
            severity: 'info',
            reason: 'Fasos/Fasum terbatas (posyandu, mushola) dapat dipertimbangkan di tepi kawasan perkebunan.',
            dasar_hukum: 'Disesuaikan dengan ketentuan RDTR setempat'
        },
        _default: {
            severity: 'warning',
            reason: 'Lahan berada di kawasan perkebunan. Diperlukan izin alih fungsi.',
            dasar_hukum: 'UU No. 39/2014'
        }
    },
    ladang: {
        PERUMAHAN: {
            severity: 'warning',
            reason: 'Perumahan di ladang/tegalan masih dapat dikaji jika RDTR mengizinkan konversi lahan kering.',
            dasar_hukum: 'Perda RDTR Kab. Bogor'
        },
        INDUSTRI: {
            severity: 'warning',
            reason: 'Industri di area ladang harus melewati AMDAL penuh dan izin lingkungan dari DPMPTSP.',
            dasar_hukum: 'UU No. 32/2009 tentang PPLH'
        },
        KOMERSIAL: {
            severity: 'info',
            reason: 'Komersial ringan di lahan ladang/tegalan relatif dapat diproses jika sesuai peruntukan RDTR.',
            dasar_hukum: 'Perda RDTR Kab. Bogor'
        },
        FASILITAS: {
            severity: 'info',
            reason: 'Fasos/Fasum di lahan ladang umumnya dapat diakomodasi, perlu verifikasi RDTR.',
            dasar_hukum: 'Perda RDTR Kab. Bogor'
        },
        _default: {
            severity: 'warning',
            reason: 'Rencana tapak menabrak lahan ladang/tegalan pertanian kering.',
            dasar_hukum: 'Perda RDTR Kab. Bogor'
        }
    },
    pemukiman: {
        PERUMAHAN: {
            severity: 'info',
            reason: 'Pembangunan perumahan SESUAI dengan peruntukan zona pemukiman dalam RDTR. Zona kompatibel.',
            dasar_hukum: 'UU No. 1/2011 tentang Perumahan dan Kawasan Permukiman'
        },
        INDUSTRI: {
            severity: 'danger',
            reason: 'Industri di zona pemukiman menciptakan konflik tata ruang kritis: kebisingan, polusi, dan risiko K3 bagi warga.',
            dasar_hukum: 'UU No. 26/2007 tentang Penataan Ruang & UU No. 32/2009 tentang PPLH'
        },
        KOMERSIAL: {
            severity: 'warning',
            reason: 'Komersial besar di zona pemukiman perlu kajian dampak lalu lintas (Andalalin) dan izin perubahan fungsi.',
            dasar_hukum: 'Perda Kab. Bogor tentang RTRW/RDTR'
        },
        FASILITAS: {
            severity: 'info',
            reason: 'Fasos/Fasum (sekolah, masjid, RS, taman) di zona pemukiman SESUAI dan sangat dianjurkan.',
            dasar_hukum: 'SNI 03-1733-2004 tentang Tata cara perencanaan lingkungan perumahan'
        },
        _default: {
            severity: 'warning',
            reason: 'Perlu kajian kesesuaian peruntukan zona pemukiman untuk kategori ini.',
            dasar_hukum: 'Perda RDTR Kab. Bogor'
        }
    }
};

// Helper: Ambil rule dari matriks berdasarkan zona dan kategori
function getZoningRule(zona: ZonaType, category: string): ZoningRule {
    const zonaRules = ZONING_MATRIX[zona];
    if (!zonaRules) return { severity: 'warning', reason: 'Data zonasi tidak tersedia.' };
    return zonaRules[category] || zonaRules['_default'] || { severity: 'warning', reason: 'Tidak ada aturan zonasi spesifik.' };
}

// Helper: Hitung skor kepatuhan berdasarkan total area dan severity
function calculateZoningScore(details: SpatialClashDetail[], totalArea: number): number {
    if (details.length === 0) return 100;
    let penalty = 0;
    for (const d of details) {
        const ratio = totalArea > 0 ? d.clashAreaSqm / totalArea : 0;
        if (d.severity === 'danger') penalty += ratio * 60 + 20;
        else if (d.severity === 'warning') penalty += ratio * 25 + 5;
        // 'info' tidak dikurangi
    }
    return Math.max(0, Math.round(100 - Math.min(penalty, 100)));
}

// ─── HOOK UTAMA ────────────────────────────────────────────────────────────────

export function useSpatialValidator() {
    const [isProcessing, setIsProcessing] = useState(false);

    const validateRiverBuffer = useCallback(
        async (
            applicantPolygonCoords: [number, number][],
            category: string = 'PERUMAHAN'
        ): Promise<SpatialAuditResult> => {
            setIsProcessing(true);

            if (!applicantPolygonCoords || applicantPolygonCoords.length < 3) {
                setIsProcessing(false);
                return {
                    isClashing: false, clashGeometry: null, clashAreaSqm: 0,
                    details: [], zoningScore: 100, verdict: 'LAYAK',
                    error: 'Geometri tanah tidak valid untuk kalkulasi spasial.'
                };
            }

            try {
                // Turf.js menggunakan format [Longitude, Latitude]
                const formattedCoords = applicantPolygonCoords.map(([a, b]) => {
                    if (a < 20 && b > 90) return [b, a]; // leaflet [lat,lng] → [lng,lat]
                    return [a, b];
                });

                // Pastikan poligon tertutup
                const firstPoint = formattedCoords[0];
                const lastPoint = formattedCoords[formattedCoords.length - 1];
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                    formattedCoords.push([...firstPoint]);
                }

                const applicantPolygon = turf.polygon([formattedCoords]);
                // Hitung luas total lahan pengajuan (untuk skor persentase)
                const applicantAreaSqm = turf.area(applicantPolygon);

                const details: SpatialClashDetail[] = [];
                let combinedClashGeometry: any = null;
                let totalDangerWarningArea = 0;

                const mergeGeometry = (intersection: any, severity: SeverityLevel) => {
                    if (severity === 'ok') return; // 'ok' tidak divisualisasikan sebagai clash
                    if (!combinedClashGeometry) {
                        combinedClashGeometry = intersection;
                    } else {
                        try {
                            combinedClashGeometry = turf.union(combinedClashGeometry, intersection);
                        } catch {
                            combinedClashGeometry = intersection;
                        }
                    }
                };

                // ── Fungsi generik checker per layer ──────────────────────────
                const checkLayer = async (
                    zona: ZonaType,
                    layerName: string,
                    loader: () => Promise<any>,
                    useBuffer?: { meters: number }
                ) => {
                    try {
                        const geoJsonModule = await loader();
                        const geoData = geoJsonModule.default || geoJsonModule;
                        let clashArea = 0;

                        for (const feature of (geoData as any).features) {
                            if (!feature.geometry) continue;
                            try {
                                const subject = useBuffer
                                    ? turf.buffer(feature, useBuffer.meters, { units: 'meters' })
                                    : feature;
                                if (!subject) continue;

                                const intersection = turf.intersect(applicantPolygon, subject);
                                if (intersection) {
                                    const areaSqm = turf.area(intersection);
                                    clashArea += areaSqm;
                                    const rule = getZoningRule(zona, category);
                                    mergeGeometry(intersection, rule.severity);
                                }
                            } catch { /* skip malformed feature */ }
                        }

                        if (clashArea > 0) {
                            const rule = getZoningRule(zona, category);
                            const clashAreaRounded = Math.round(clashArea);
                            const percentOfLahan = applicantAreaSqm > 0
                                ? ((clashArea / applicantAreaSqm) * 100).toFixed(1)
                                : '?';

                            details.push({
                                layerId: `layer-${zona === 'sungai' ? 'river' : zona === 'pemukiman' ? 'aqi' : zona}`,
                                layerName,
                                clashAreaSqm: clashAreaRounded,
                                description: `${rule.reason} (${percentOfLahan}% dari lahan — ${clashAreaRounded.toLocaleString('id-ID')} m²)`,
                                severity: rule.severity,
                                zoningNote: rule.dasar_hukum
                            });

                            if (rule.severity === 'danger' || rule.severity === 'warning') {
                                totalDangerWarningArea += clashArea;
                            }
                        } else {
                            // Lahan BERSIH dari zona ini — tampilkan sebagai info positif
                            details.push({
                                layerId: `layer-${zona === 'sungai' ? 'river' : zona === 'pemukiman' ? 'aqi' : zona}`,
                                layerName,
                                clashAreaSqm: 0,
                                description: `Bersih — tidak ada tumpang tindih dengan ${layerName}.`,
                                severity: 'info'
                            });
                        }
                    } catch (e) {
                        console.error(`Gagal memuat/menghitung layer ${layerName}:`, e);
                    }
                };

                // ── Jalankan semua pemeriksaan secara paralel ─────────────────
                await Promise.all([
                    checkLayer('sungai',    'Sempadan Sungai 25m',          () => import('@/assets/geojson/bogor/SUNGAI_LN_25K.json'),          { meters: 25 }),
                    checkLayer('pasir',     'Kawasan Konservasi Gumuk Pasir',() => import('@/assets/geojson/kab bogor/PASIR_AR_25K.json')),
                    checkLayer('sawah',     'Lahan Sawah Dilindungi (LSD)', () => import('@/assets/geojson/bogor/AGRISAWAH_AR_25K.json')),
                    checkLayer('kebun',     'Kawasan Perkebunan',           () => import('@/assets/geojson/bogor/AGRIKEBUN_AR_25K.json')),
                    checkLayer('ladang',    'Kawasan Ladang / Tegalan',     () => import('@/assets/geojson/bogor/AGRILADANG_AR_25K.json')),
                    checkLayer('pemukiman', 'Zona Peruntukan Pemukiman',    () => import('@/assets/geojson/bogor/PEMUKIMAN_AR_25K.json')),
                ]);

                const zoningScore = calculateZoningScore(details, applicantAreaSqm);
                const hasDanger  = details.some(d => d.severity === 'danger');
                const hasWarning = details.some(d => d.severity === 'warning');
                const verdict: SpatialAuditResult['verdict'] =
                    hasDanger  ? 'TIDAK_LAYAK' :
                    hasWarning ? 'PERLU_REVISI' :
                    'LAYAK';

                setIsProcessing(false);

                return {
                    isClashing: hasDanger || hasWarning,
                    clashGeometry: combinedClashGeometry,
                    clashAreaSqm: Math.round(totalDangerWarningArea),
                    details,
                    zoningScore,
                    verdict
                };

            } catch (err: any) {
                setIsProcessing(false);
                const errMsg = err?.message || 'Gagal memproses analisis spasial multi-layer.';
                toast.error(errMsg);
                return {
                    isClashing: false, clashGeometry: null, clashAreaSqm: 0,
                    details: [], zoningScore: 0, verdict: 'TIDAK_LAYAK',
                    error: errMsg
                };
            }
        },
        []
    );

    return { validateRiverBuffer, isProcessing };
}