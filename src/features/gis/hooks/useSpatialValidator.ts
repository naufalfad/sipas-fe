import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// @ts-ignore - Bypass issue mapping exports Turf.js v6.5 di TypeScript modern (Vite)
import * as turf from '@turf/turf';

export interface SpatialAuditResult {
    isClashing: boolean;
    clashGeometry: any | null;
    clashAreaSqm: number;
    error?: string;
}

export function useSpatialValidator() {
    const [isProcessing, setIsProcessing] = useState(false);

    const validateRiverBuffer = useCallback(
        async (applicantPolygonCoords: [number, number][]): Promise<SpatialAuditResult> => {
            setIsProcessing(true);

            if (!applicantPolygonCoords || applicantPolygonCoords.length < 3) {
                setIsProcessing(false);
                return {
                    isClashing: false,
                    clashGeometry: null,
                    clashAreaSqm: 0,
                    error: "Geometri tanah tidak valid untuk kalkulasi spasial."
                };
            }

            try {
                // Dynamic import untuk performa bundel
                const riverGeoJsonModule = await import('@/assets/geojson/bogor/SUNGAI_LN_25K.json');
                const riverData = (riverGeoJsonModule.default || riverGeoJsonModule) as any;

                if (!riverData || !riverData.features) {
                    throw new Error("File GeoJSON Sungai tidak terbaca dengan benar.");
                }

                // Turf.js menggunakan format [Longitude, Latitude]
                const formattedCoords = applicantPolygonCoords.map(([lat, lng]) => [lng, lat]);

                // Pastikan poligon tertutup
                const firstPoint = formattedCoords[0];
                const lastPoint = formattedCoords[formattedCoords.length - 1];
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                    formattedCoords.push([...firstPoint]);
                }

                const applicantPolygon = turf.polygon([formattedCoords]);

                let totalClashArea = 0;
                let combinedClashGeometry: any = null;
                let isClashing = false;

                for (const feature of riverData.features) {
                    if (!feature.geometry) continue;

                    try {
                        const bufferedRiver = turf.buffer(feature, 25, { units: 'meters' });
                        if (!bufferedRiver) continue;

                        const intersection = turf.intersect(turf.featureCollection([applicantPolygon, bufferedRiver]));

                        if (intersection) {
                            isClashing = true;
                            const areaSqm = turf.area(intersection);
                            totalClashArea += areaSqm;

                            if (!combinedClashGeometry) {
                                combinedClashGeometry = intersection;
                            } else {
                                try {
                                    combinedClashGeometry = turf.union(turf.featureCollection([combinedClashGeometry, intersection]));
                                } catch {
                                    combinedClashGeometry = intersection; // Fallback
                                }
                            }
                        }
                    } catch (innerError) {
                        continue;
                    }
                }

                setIsProcessing(false);
                return {
                    isClashing,
                    clashGeometry: combinedClashGeometry,
                    clashAreaSqm: Math.round(totalClashArea)
                };

            } catch (err: any) {
                setIsProcessing(false);
                const errMsg = err?.message || "Gagal memproses analisis spasial.";
                toast.error(errMsg);
                return {
                    isClashing: false,
                    clashGeometry: null,
                    clashAreaSqm: 0,
                    error: errMsg
                };
            }
        },
        []
    );

    return {
        validateRiverBuffer,
        isProcessing
    };
}