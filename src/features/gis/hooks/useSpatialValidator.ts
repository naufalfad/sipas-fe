import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL as API_BASE_URL_CONFIG } from '@/config';

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
                    isClashing: false,
                    clashGeometry: null,
                    clashAreaSqm: 0,
                    details: [],
                    zoningScore: 100,
                    verdict: 'LAYAK',
                    error: 'Geometri tanah tidak valid untuk kalkulasi spasial.'
                };
            }

            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL_CONFIG}/api/v1/submissions/spatial-audit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        polygon: applicantPolygonCoords,
                        category
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.detail || 'Gagal memproses analisis spasial di server.');
                }

                const result = await response.json();
                setIsProcessing(false);
                return result;

            } catch (err: any) {
                setIsProcessing(false);
                const errMsg = err?.message || 'Gagal memproses analisis spasial.';
                toast.error(errMsg);
                return {
                    isClashing: false,
                    clashGeometry: null,
                    clashAreaSqm: 0,
                    details: [],
                    zoningScore: 0,
                    verdict: 'TIDAK_LAYAK',
                    error: errMsg
                };
            }
        },
        []
    );

    return { validateRiverBuffer, isProcessing };
}