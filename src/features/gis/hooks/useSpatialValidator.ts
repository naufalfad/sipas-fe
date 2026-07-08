/**
 * ============================================================================
 * SIPAS CUSTOM HOOK — Server-Side Spatial Audit Trigger [useSpatialValidator.ts]
 * ============================================================================
 * Peran: Menghubungkan antarmuka pengguna ke mesin komputasi spasial PostGIS 
 *        di sisi backend secara asinkron.
 * 
 * Desain: Menghapus total dependensi @turf/turf untuk menghemat ukuran bundle 
 *         Vite production-build, mendelegasikan beban berat CPU ke server (PostGIS),
 *         dan menerjemahkan response snake_case ke tipe camelCase sistem UI.
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';

// ─── SECTION 1: ANTARMUKA KONTRAK DATA (SYSTEM CONTRACTS) ───────────────────

export interface SpatialClashDetail {
    layerId: string;
    layerName: string;
    clashAreaSqm: number;
    description: string;
    severity: 'danger' | 'warning' | 'info';
    zoningNote?: string;
}

export interface SpatialAuditResult {
    isClashing: boolean;
    clashGeometry: any | null; // Kembalian GeoJSON poligon irisan clash berwarna merah
    clashAreaSqm: number;
    details: SpatialClashDetail[];
    zoningScore: number;       // Skor kepatuhan spasial (0 - 100)
    verdict: 'LAYAK' | 'PERLU_REVISI' | 'TIDAK_LAYAK';
    error?: string;
}

// ─── SECTION 2: HOOK UTAMA ───────────────────────────────────────────────────

export function useSpatialValidator() {
    const [isProcessing, setIsProcessing] = useState(false);

    // Ambil ID permohonan aktif dari store global UI GIS (Information Expert)
    const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);

    const validateRiverBuffer = useCallback(
        async (
            // Parameter koordinat tetap disediakan untuk backward-compatibility dengan panel UI lama
            _applicantPolygonCoords?: [number, number][],
            _category: string = 'PERUMAHAN'
        ): Promise<SpatialAuditResult> => {
            setIsProcessing(true);

            // Guard: Pastikan ada ID pengajuan terpilih sebelum menembak API
            const submissionId = selectedCompanyId;
            if (!submissionId) {
                setIsProcessing(false);
                const errMsg = "Tidak ada berkas permohonan aktif terpilih di peta.";
                toast.error(errMsg);
                return {
                    isClashing: false, clashGeometry: null, clashAreaSqm: 0,
                    details: [], zoningScore: 100, verdict: 'LAYAK',
                    error: errMsg
                };
            }

            try {
                // 1. Dapatkan token JWT untuk otorisasi endpoint dinas (Security SoD)
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                };

                // 2. Hubungi endpoint audit spasial backend PostGIS
                const response = await fetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}/spatial-audit`, {
                    method: 'GET',
                    headers
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.detail || `Server merespon dengan kode HTTP ${response.status}`);
                }

                const data = await response.json();

                // 3. Transformasikan response model database (snake_case) ke format UI (camelCase)
                const result: SpatialAuditResult = {
                    isClashing: data.is_clashing,
                    clashGeometry: data.clash_geometry || null,
                    clashAreaSqm: data.clash_area_sqm,
                    zoningScore: data.zoning_score,
                    verdict: data.verdict as SpatialAuditResult['verdict'],
                    details: data.details.map((detail: any) => ({
                        layerId: detail.layer_id,
                        layerName: detail.layer_name,
                        clashAreaSqm: detail.clash_area_sqm,
                        description: detail.description,
                        severity: detail.severity as SpatialClashDetail['severity'],
                        zoningNote: detail.zoning_note || undefined
                    }))
                };

                setIsProcessing(false);
                return result;

            } catch (err: any) {
                setIsProcessing(false);
                const errMsg = err?.message || 'Gagal memproses kalkulasi spasial di server.';
                toast.error(`Kegagalan Sistem: ${errMsg}`);
                return {
                    isClashing: false, clashGeometry: null, clashAreaSqm: 0,
                    details: [], zoningScore: 0, verdict: 'TIDAK_LAYAK',
                    error: errMsg
                };
            }
        },
        [selectedCompanyId]
    );

    return { validateRiverBuffer, isProcessing };
}