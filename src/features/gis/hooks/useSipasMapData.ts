import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Supercluster from 'supercluster';
import type { BBox, GeoJsonProperties } from 'geojson';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { Submission } from '@/features/submission/types';
import {
  leafletRingToGeoJSON,
  calcExtrusionHeight,
  resolveStatusColor,
  resolveLayerCategory,
} from '@/lib/geoUtils';

export interface ProcessedSubmission extends Submission {
  color: string;
  categoryLayer: string;
  extrusionHeight: number;
}

export function useSipasMapData(localZoom: number) {
  // ── Zustand State Subscriptions ──
  const activeLayers = useGisUIStore((s) => s.activeLayers);
  const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
  const activeKompensasi = useGisUIStore((s) => s.activeKompensasi);
  const setSelectedCompanyId = useGisUIStore((s) => s.setSelectedCompanyId);
  const openPanel = useGisUIStore((s) => s.openPanel);
  const closePanelsToTheRight = useGisUIStore((s) => s.closePanelsToTheRight);

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
  const [activeGeometries, setActiveGeometries] = useState<{
    roadPolygons?: number[][][];
    rthPolygons?: number[][][];
    psuPolygons?: number[][][];
    kavlingPolygons?: number[][][];
  } | null>(null);

  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: SubmissionService.getAll,
  });

  useEffect(() => {
    if (!selectedCompanyId) {
      setActiveGeometries(null);
      return;
    }
    let active = true;
    SubmissionService.getGeometries(selectedCompanyId).then((data) => {
      if (active && data) {
        setActiveGeometries(data);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedCompanyId]);

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
      .map((sub: Submission) => ({
        ...sub,
        color: resolveStatusColor(sub.status),
        categoryLayer: resolveLayerCategory(sub.landArea),
        extrusionHeight: calcExtrusionHeight(sub),
      }))
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
              height: sub.extrusionHeight,
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

  const subPolygonsGeoJSON = useMemo(() => {
    const features: any[] = [];

    const getCentroid = (ring: [number, number][]): [number, number] => {
      let totalLng = 0;
      let totalLat = 0;
      ring.forEach(([lng, lat]) => {
        totalLng += lng;
        totalLat += lat;
      });
      return [totalLng / ring.length, totalLat / ring.length];
    };

    const shrinkRing = (ring: [number, number][], factor: number, centroid: [number, number]): [number, number][] => {
      return ring.map(([lng, lat]) => {
        const dx = lng - centroid[0];
        const dy = lat - centroid[1];
        return [centroid[0] + dx * factor, centroid[1] + dy * factor];
      });
    };

    if (activeGeometries && selectedCompanyId) {
      const parentSub = processedSubmissions.find((s) => s.id === selectedCompanyId);
      const parentHeight = parentSub ? parentSub.extrusionHeight : 10;
      const addPoly = (rings: number[][][], color: string, type: string) => {
        rings.forEach((ring) => {
          try {
            // Sejak koordinat dari activeGeometries (API PostGIS) sudah dalam format [Lng, Lat],
            // kita gunakan langsung dan pastikan ring tertutup tanpa Lng/Lat Swap.
            const geoJSONRing = [...ring] as [number, number][];
            if (geoJSONRing.length > 0) {
              const first = geoJSONRing[0];
              const last = geoJSONRing[geoJSONRing.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                geoJSONRing.push([first[0], first[1]]);
              }
            }

            features.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [geoJSONRing] },
              properties: {
                id: selectedCompanyId,
                color,
                type,
                submissionId: selectedCompanyId,
                height: parentHeight,
                base: 0,
              },
            });

            if (type === 'kavling' || type === 'psu') {
              const centroid = getCentroid(geoJSONRing);
              const roofColor = '#c2410c';

              const tiers = [
                { factor: 0.85, baseOffset: 0, heightOffset: 0.8 },
                { factor: 0.6, baseOffset: 0.8, heightOffset: 1.6 },
                { factor: 0.35, baseOffset: 1.6, heightOffset: 2.3 },
                { factor: 0.1, baseOffset: 2.3, heightOffset: 2.8 },
              ];

              tiers.forEach((tier) => {
                const shrunk = shrinkRing(geoJSONRing, tier.factor, centroid);
                features.push({
                  type: 'Feature',
                  geometry: { type: 'Polygon', coordinates: [shrunk] },
                  properties: {
                    id: selectedCompanyId,
                    color: roofColor,
                    type: 'roof-tier',
                    submissionId: selectedCompanyId,
                    base: parentHeight + tier.baseOffset,
                    height: parentHeight + tier.heightOffset,
                  },
                });
              });
            }
          } catch { /* skip */ }
        });
      };
      if (activeGeometries.roadPolygons) addPoly(activeGeometries.roadPolygons, '#cbd5e1', 'road');
      if (activeGeometries.rthPolygons) addPoly(activeGeometries.rthPolygons, '#10b981', 'rth');
      if (activeGeometries.psuPolygons) addPoly(activeGeometries.psuPolygons, '#14b8a6', 'psu');
      if (activeGeometries.kavlingPolygons) addPoly(activeGeometries.kavlingPolygons, '#64748b', 'kavling');
    } else {
      processedSubmissions.forEach((sub) => {
        const loc = sub.location;
        const addPoly = (rings: [number, number][][], color: string, type: string) => {
          rings.forEach((ring) => {
            try {
              const geoJSONRing = leafletRingToGeoJSON(ring);

              features.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [geoJSONRing] },
                properties: {
                  id: sub.id,
                  color,
                  type,
                  submissionId: sub.id,
                  height: sub.extrusionHeight,
                  base: 0,
                },
              });

              if (type === 'kavling' || type === 'psu') {
                const centroid = getCentroid(geoJSONRing);
                const roofColor = '#c2410c';

                const tiers = [
                  { factor: 0.85, baseOffset: 0, heightOffset: 0.8 },
                  { factor: 0.6, baseOffset: 0.8, heightOffset: 1.6 },
                  { factor: 0.35, baseOffset: 1.6, heightOffset: 2.3 },
                  { factor: 0.1, baseOffset: 2.3, heightOffset: 2.8 },
                ];

                tiers.forEach((tier) => {
                  const shrunk = shrinkRing(geoJSONRing, tier.factor, centroid);
                  features.push({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [shrunk] },
                    properties: {
                      id: sub.id,
                      color: roofColor,
                      type: 'roof-tier',
                      submissionId: sub.id,
                      base: sub.extrusionHeight + tier.baseOffset,
                      height: sub.extrusionHeight + tier.heightOffset,
                    },
                  });
                });
              }
            } catch { /* skip */ }
          });
        };
        if (loc.roadPolygons) addPoly(loc.roadPolygons, '#cbd5e1', 'road');
        if (loc.rthPolygons) addPoly(loc.rthPolygons, '#10b981', 'rth');
        if (loc.psuPolygons) addPoly(loc.psuPolygons, '#14b8a6', 'psu');
        if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'kavling');
      });
    }
    return { type: 'FeatureCollection' as const, features };
  }, [processedSubmissions, activeGeometries, selectedCompanyId]);

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
      geometry: { type: 'Point' as const, coordinates: [sub.location.lng, sub.location.lat] },
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
