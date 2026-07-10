/**
 * ============================================================================
 * GEOSIPAS GIS HOOK — Map Data Orchestrator [useSipasMapData.ts] (REVISED v9)
 * ============================================================================
 * Peran  : Hook utama untuk mengelola pemuatan asinkron seluruh layer geospasial,
 *          menangani cluster, dan menyelaraskan state spasial dengan Zustand store.
 *          Telah diamandemen penuh untuk memindahkan beban pemrosesan koordinat
 *          berat dari browser UI thread ke level PostGIS database.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Supercluster from 'supercluster';
import type { BBox, GeoJsonProperties } from 'geojson';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { Submission } from '@/features/submission/types';
import { API_BASE_URL } from '@/config';
import {
  leafletRingToGeoJSON,
  polygonCentroid,
  resolveStatusColor,
  resolveLayerCategory,
} from '@/lib/geoUtils';

export interface ProcessedSubmission extends Submission {
  color: string;
  categoryLayer: string;
  /** Centroid polygon batas lahan [lat, lng] — posisi tepat di tengah SHP */
  centroidLat: number;
  centroidLng: number;
}

export function useSipasMapData(localZoom: number) {
  // ── Zustand State Subscriptions ──
  const activeLayers = useGisUIStore((s) => s.activeLayers);
  const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
  const activeKompensasi = useGisUIStore((s) => s.activeKompensasi);

  // Ambil state tembolok spasial global terbaru dari Zustand
  const activeSubmissionGeoJson = useGisUIStore((s) => s.activeSubmissionGeoJson);
  const visibleSubLayers = useGisUIStore((s) => s.visibleSubLayers);
  const setActiveSubmissionGeoJson = useGisUIStore((s) => s.setActiveSubmissionGeoJson);
  const clearSpatialCache = useGisUIStore((s) => s.clearSpatialCache);

  const [sungaiData, setSungaiData] = useState<any>(null);
  const [konturData, setKonturData] = useState<any>(null);
  const [pemukimanData, setPemukimanData] = useState<any>(null);
  const [bangunanData, setBangunanData] = useState<any>(null);
  const [sawahData, setSawahData] = useState<any>(null);
  const [pasirData, setPasirData] = useState<any>(null);
  const [kebunData, setKebunData] = useState<any>(null);
  const [ladangData, setLadangData] = useState<any>(null);
  const [administrasiData, setAdministrasiData] = useState<any>(null);
  const [desaData, setDesaData] = useState<any>(null);
  const [danauData, setDanauData] = useState<any>(null);
  const [jalanData, setJalanData] = useState<any>(null);
  const [tanamCampurData, setTanamCampurData] = useState<any>(null);
  const [hutanKeringData, setHutanKeringData] = useState<any>(null);
  const [alangData, setAlangData] = useState<any>(null);
  const [semakData, setSemakData] = useState<any>(null);
  const [punggungBukitData, setPunggungBukitData] = useState<any>(null);
  const [relkaData, setRelkaData] = useState<any>(null);

  const [clusters, setClusters] = useState<any[]>([]);
  const [popupInfo, setPopupInfo] = useState<ProcessedSubmission | null>(null);
  const [viewBBox, setViewBBox] = useState<BBox>([-180, -85, 180, 85]);
  const [clashGeoJSON, setClashGeoJSON] = useState<any>(null);

  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions-all'],
    queryFn: SubmissionService.getAllList,
  });

  // ─── AUDIT: PEMBERSIHAN TEMBOLOK SPASIAL OTOMATIS SAAT BERPINDAH HALAMAN ───
  useEffect(() => {
    return () => {
      // Membersihkan data spasial, kursor, dan filter sub-layer dari memori Zustand
      // untuk menjamin performa peramban tetap stabil tanpa kebocoran memori (leak-proof)
      clearSpatialCache();
    };
  }, [clearSpatialCache]);

  // ─── AMANDEMEN: FETCH GEOJSON SITE PLAN DARI BACKEND SECARA STATELESS ───
  useEffect(() => {
    if (!selectedCompanyId) {
      setActiveSubmissionGeoJson(null);
      return;
    }

    let active = true;

    const fetchActiveGeoJson = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/v1/submissions/${selectedCompanyId}/geojson`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (active) {
            setActiveSubmissionGeoJson(data);
          }
        }
      } catch (err) {
        console.warn(`[useSipasMapData] Gagal memuat GeoJSON untuk permohonan ${selectedCompanyId}:`, err);
      }
    };

    fetchActiveGeoJson();

    return () => {
      active = false;
    };
  }, [selectedCompanyId, setActiveSubmissionGeoJson]);

  // ─── DYNAMIC LOAD EFFECTS ───
  useEffect(() => {
    if (activeLayers.includes('layer-river') && localZoom >= 10 && !sungaiData) {
      import('@/assets/geojson/bogor/SUNGAI_LN_25K.json')
        .then((m) => setSungaiData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, sungaiData]);

  useEffect(() => {
    if (activeLayers.includes('layer-kontur') && localZoom >= 10 && !konturData) {
      import('@/assets/geojson/bogor/KONTUR_LN_25K.json')
        .then((m) => setKonturData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, konturData]);

  useEffect(() => {
    if (activeLayers.includes('layer-aqi') && localZoom >= 10 && !pemukimanData) {
      import('@/assets/geojson/bogor/PEMUKIMAN_AR_25K.json')
        .then((m) => setPemukimanData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, pemukimanData]);

  useEffect(() => {
    if (localZoom >= 14 && !bangunanData) {
      import('@/assets/geojson/bogor/BANGUNAN_AR_25K.json')
        .then((m) => setBangunanData(m.default)).catch(console.error);
    }
  }, [localZoom, bangunanData]);

  useEffect(() => {
    if (activeLayers.includes('layer-sawah') && localZoom >= 10 && !sawahData) {
      import('@/assets/geojson/bogor/AGRISAWAH_AR_25K.json')
        .then((m) => setSawahData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, sawahData]);

  useEffect(() => {
    if (activeLayers.includes('layer-pasir') && localZoom >= 10 && !pasirData) {
      import('@/assets/geojson/kab bogor/PASIR_AR_25K.json')
        .then((m) => setPasirData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, pasirData]);

  useEffect(() => {
    if (activeLayers.includes('layer-kebun') && localZoom >= 10 && !kebunData) {
      import('@/assets/geojson/bogor/AGRIKEBUN_AR_25K.json')
        .then((m) => setKebunData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, kebunData]);

  useEffect(() => {
    if (activeLayers.includes('layer-ladang') && localZoom >= 10 && !ladangData) {
      import('@/assets/geojson/bogor/AGRILADANG_AR_25K.json')
        .then((m) => setLadangData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, ladangData]);

  useEffect(() => {
    if (activeLayers.includes('layer-administrasi') && localZoom >= 8 && !administrasiData) {
      import('@/assets/geojson/kab bogor/ADMINISTRASI_LN_25K.json')
        .then((m) => setAdministrasiData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, administrasiData]);

  useEffect(() => {
    if (activeLayers.includes('layer-desa') && localZoom >= 10 && !desaData) {
      import('@/assets/geojson/kab bogor/ADMINISTRASIDESA_AR_25K.json')
        .then((m) => setDesaData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, desaData]);

  useEffect(() => {
    if (activeLayers.includes('layer-danau') && localZoom >= 8 && !danauData) {
      import('@/assets/geojson/kab bogor/DANAU_AR_25K.json')
        .then((m) => setDanauData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, danauData]);

  useEffect(() => {
    if (activeLayers.includes('layer-jalan') && localZoom >= 10 && !jalanData) {
      import('@/assets/geojson/kab bogor/JALAN_LN_25K.json')
        .then((m) => setJalanData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, jalanData]);

  useEffect(() => {
    if (activeLayers.includes('layer-tanamcampur') && localZoom >= 10 && !tanamCampurData) {
      import('@/assets/geojson/kab bogor/AGRITANAMCAMPUR_AR_25K.json')
        .then((m) => setTanamCampurData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, tanamCampurData]);

  useEffect(() => {
    if (activeLayers.includes('layer-hutankering') && localZoom >= 10 && !hutanKeringData) {
      import('@/assets/geojson/kab bogor/NONAGRIHUTANKERING_AR_25K.json')
        .then((m) => setHutanKeringData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, hutanKeringData]);

  useEffect(() => {
    if (activeLayers.includes('layer-alang') && localZoom >= 10 && !alangData) {
      import('@/assets/geojson/kab bogor/NONAGRIALANG_AR_25K.json')
        .then((m) => setAlangData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, alangData]);

  useEffect(() => {
    if (activeLayers.includes('layer-semak') && localZoom >= 10 && !semakData) {
      import('@/assets/geojson/kab bogor/NONAGRISEMAKBELUKAR_AR_25K.json')
        .then((m) => setSemakData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, semakData]);

  useEffect(() => {
    if (activeLayers.includes('layer-punggungbukit') && localZoom >= 10 && !punggungBukitData) {
      import('@/assets/geojson/kab bogor/PUNGGUNGBUKIT_LN_25K.json')
        .then((m) => setPunggungBukitData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, punggungBukitData]);

  useEffect(() => {
    if (activeLayers.includes('layer-relka') && localZoom >= 8 && !relkaData) {
      import('@/assets/geojson/kab bogor/RELKA_LN_25K.json')
        .then((m) => setRelkaData(m.default)).catch(console.error);
    }
  }, [activeLayers, localZoom, relkaData]);

  // ─── MEMOIZED GEOMETRIES ───
  const processedSubmissions = useMemo<ProcessedSubmission[]>(() =>
    submissions
      .map((sub: Submission) => {
        let centroidLat = sub.location.lat;
        let centroidLng = sub.location.lng;
        const polygon = sub.location.polygon as [number, number][] | undefined;
        if (polygon && polygon.length >= 3) {
          try {
            const leafletPolygon = polygon.map((p) => {
              if (p[0] >= 90 && p[0] <= 145 && p[1] >= -15 && p[1] <= 10) {
                return [p[1], p[0]] as [number, number];
              }
              return p as [number, number];
            });
            const centroid = polygonCentroid(leafletPolygon);
            if (centroid) {
              centroidLat = centroid[0];
              centroidLng = centroid[1];
            }
          } catch { /* fallback */ }
        }
        return {
          ...sub,
          color: resolveStatusColor(sub.status),
          categoryLayer: resolveLayerCategory(sub.landArea),
          centroidLat,
          centroidLng,
        };
      })
      .filter((sub) => activeLayers.includes(sub.categoryLayer)),
    [submissions, activeLayers]
  );

  const submissionsGeoJSON = useMemo(() => {
    const features = processedSubmissions
      .filter((sub) => sub.location.polygon && sub.location.polygon.length >= 3)
      .map((sub) => {
        try {
          const ring = leafletRingToGeoJSON(sub.location.polygon as [number, number][]);
          return {
            type: 'Feature' as const,
            geometry: { type: 'Polygon' as const, coordinates: [ring] },
            properties: {
              id: sub.id,
              color: sub.color,
              status: sub.status,
              housingName: sub.housingName,
              categoryLayer: sub.categoryLayer,
            },
          };
        } catch {
          return null;
        }
      })
      .filter((f): f is Exclude<typeof f, null> => f !== null);

    return { type: 'FeatureCollection' as const, features };
  }, [processedSubmissions]);

  // ─── OPTIMASI FILTER SUB-LAYERS DI SISI FRONTEND (ZERO CPU-BOUND BLOCKS) ───
  const subPolygonsGeoJSON = useMemo(() => {
    if (!activeSubmissionGeoJson) return null;

    // Filter fitur GeoJSON secara aman berdasarkan sub-layer yang sedang di-toggle aktif oleh pengguna
    const filteredFeatures = activeSubmissionGeoJson.features.filter((f: any) =>
      visibleSubLayers.includes(f.properties?.layer_name)
    );

    return {
      ...activeSubmissionGeoJson,
      features: filteredFeatures
    };
  }, [activeSubmissionGeoJson, visibleSubLayers]);

  const compensationGeoJSON = useMemo(() => {
    if (!activeKompensasi || !activeKompensasi.polygon || activeKompensasi.polygon.length < 3) return null;
    try {
      const ring = leafletRingToGeoJSON(activeKompensasi.polygon);
      return {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {
            id: activeKompensasi.idKompensasi,
            type: activeKompensasi.tipeKompensasi,
            status: activeKompensasi.statusPemenuhan,
          },
        }],
      };
    } catch (e) {
      console.warn('[SipasMap] Gagal mengolah GeoJSON kompensasi:', e);
      return null;
    }
  }, [activeKompensasi]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster<GeoJsonProperties>({ radius: 80, maxZoom: 12, minZoom: 0 });
    sc.load(processedSubmissions.map((sub) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [sub.centroidLng, sub.centroidLat] },
      properties: {
        submissionId: sub.id, color: sub.color,
        housingName: sub.housingName, developerName: sub.developerName, status: sub.status,
      },
    })));
    return sc;
  }, [processedSubmissions]);

  const intZoom = Math.floor(localZoom);
  useEffect(() => {
    try {
      setClusters(supercluster.getClusters(viewBBox, intZoom));
    } catch {
      setClusters([]);
    }
  }, [supercluster, viewBBox, intZoom]);

  useEffect(() => {
    const handleRenderClash = (e: Event) => {
      const ev = e as CustomEvent;
      if (!ev.detail?.clashGeometry?.geometry) return;
      try {
        setClashGeoJSON({ type: 'FeatureCollection', features: [ev.detail.clashGeometry] });
      } catch {
        setClashGeoJSON(null);
      }
    };
    const handleClearClash = () => setClashGeoJSON(null);
    window.addEventListener('map-render-clash', handleRenderClash);
    window.addEventListener('map-clear-clash', handleClearClash);
    return () => {
      window.removeEventListener('map-render-clash', handleRenderClash);
      window.removeEventListener('map-clear-clash', handleClearClash);
    };
  }, []);

  return {
    processedSubmissions,
    submissionsGeoJSON,
    subPolygonsGeoJSON,
    compensationGeoJSON,
    supercluster,
    clusters,
    clashGeoJSON,
    popupInfo,
    setPopupInfo,
    viewBBox,
    setViewBBox,
    sungaiData,
    konturData,
    pemukimanData,
    bangunanData,
    sawahData,
    pasirData,
    kebunData,
    ladangData,
    administrasiData,
    desaData,
    danauData,
    jalanData,
    tanamCampurData,
    hutanKeringData,
    alangData,
    semakData,
    punggungBukitData,
    relkaData,
  };
}