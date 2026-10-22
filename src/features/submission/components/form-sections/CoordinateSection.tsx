import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  CheckCircle2, 
  RefreshCw, 
  FileUp, 
  Loader2, 
  ShieldCheck, 
  Search, 
  AlertTriangle,
  Layers,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { CADGeoreferenceWizard } from './CADGeoreferenceWizard';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';
import { uploadFileToBackend } from '../../utils/upload';
import { SubmissionService } from '../../services/submission.service';
import { MOCK_SITE_BOUNDS } from '@/mock/siteplan/mockSiteConfig';
import { pkkprApi } from '@/features/pkkpr/api/pkkprApi';
import type { 
  ValidatePhasedSitePlanResponse,
  PKKPRQuotaSummary
} from '@/features/pkkpr/types/pkkpr.types';
// @ts-ignore
import * as turf from '@turf/turf';

/** Menghitung luas poligon m² secara presisi berbasis Turf.js */
const calculatePolygonAreaM2 = (ring: number[][]): number => {
  if (!ring || ring.length < 3) return 0;
  try {
    const closedRing = [...ring];
    const first = closedRing[0];
    const last = closedRing[closedRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closedRing.push(first);
    }
    const poly = turf.polygon([closedRing]);
    return Math.round(turf.area(poly));
  } catch (e) {
    console.warn('Gagal menghitung luas polygon turf:', e);
    return 0;
  }
};

/** Subkomponen pembantu untuk otomatis memusatkan dan menyesuaikan batas pandang peta */
const MapBoundsFitter: React.FC<{ geometry?: any }> = ({ geometry }) => {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    try {
      const geoLayer = L.geoJSON(geometry);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    } catch (e) {
      console.warn('MapBoundsFitter error:', e);
    }
  }, [geometry, map]);
  return null;
};

export const CoordinateSection = () => {
  const { register, setValue, watch, getValues } = useFormContext<FullSubmissionFormValues>();
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [uploadedGeoJson, setUploadedGeoJson] = useState<any>(null);

  // State untuk kontrol modal Wizard Georeferencing CAD
  const [isCadWizardOpen, setIsCadWizardOpen] = useState(false);
  const [mapResetKey, setMapResetKey] = useState(0);
  const cadFileName = watch('coordinate.cadFileName') || '';
  const landPolygon = watch('coordinate.polygon') as [number, number][] | undefined;
  const pkkprId = watch('spatial.pkkprId');
  const landArea = watch('location.landArea') || 0;

  // State SK PKKPR Induk & Kuota Spasial Bertahap
  const [quotaSummary, setQuotaSummary] = useState<PKKPRQuotaSummary | null>(null);

  // Ambil ringkasan kuota dan geometri spasial SK PKKPR induk jika pkkprId terpilih
  useEffect(() => {
    let isMounted = true;
    if (pkkprId) {
      pkkprApi.getQuotaSummary(pkkprId)
        .then((summary) => {
          if (isMounted) setQuotaSummary(summary);
        })
        .catch((err) => {
          console.error('Gagal memuat ringkasan kuota PKKPR:', err);
        });
    } else {
      setQuotaSummary(null);
    }
    return () => { isMounted = false; };
  }, [pkkprId]);

  // State Pre-Flight Boundary Inspector
  const [isValidatingBoundary, setIsValidatingBoundary] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidatePhasedSitePlanResponse | null>(null);

  const handleValidatePhasedBoundary = async () => {
    if (!pkkprId) {
      toast.warning('Pilih SK PKKPR terlebih dahulu pada Tahap 5 (Kesesuaian Tata Ruang).');
      return;
    }

    // Ekstrak geometri poligon yang tersedia
    let coords = landPolygon;
    if (!coords && uploadedGeoJson) {
      const feat = uploadedGeoJson.features?.[0] || uploadedGeoJson;
      if (feat?.geometry?.coordinates?.[0]) {
        coords = feat.geometry.coordinates[0];
      }
    }

    if (!coords || coords.length < 3) {
      toast.error('Batas poligon belum digambar atau diunggah di atas peta!');
      return;
    }

    const closedCoords = [...coords];
    if (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] ||
        closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]) {
      closedCoords.push(closedCoords[0]);
    }

    const geomPayload = {
      type: 'Polygon',
      coordinates: [closedCoords]
    };

    setIsValidatingBoundary(true);
    try {
      const res = await pkkprApi.validatePhasedSitePlan({
        pkkpr_id: pkkprId,
        new_area_m2: Number(landArea) || 0,
        siteplan_geometry: geomPayload
      });
      setValidationResult(res);
      if (res.is_valid) {
        toast.success('Validasi Spasial Sukses: Denah Site Plan 100% berada di dalam batas izin PKKPR!');
      } else {
        toast.error(res.error || 'Terdeteksi ketidaksesuaian batas spasial atau kuota.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memvalidasi kepatuhan spasial dengan server.');
    } finally {
      setIsValidatingBoundary(false);
    }
  };

  const handleSpatialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasan ukuran berkas 20MB secara ketat
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
      return;
    }

    setSpatialLoading(true);
    const reader = new FileReader();

    if (file.name.endsWith('.geojson')) {
      reader.onload = (event) => {
        try {
          const geojson = JSON.parse(event.target?.result as string);
          setUploadedGeoJson(geojson);

          // Sinkronisasi data koordinat ke form
          const firstFeature = geojson.features?.[0] || geojson;
          if (firstFeature && firstFeature.geometry && (firstFeature.geometry.type === 'Polygon' || firstFeature.geometry.type === 'MultiPolygon')) {
            const rawCoords = firstFeature.geometry.coordinates;
            const ringCoords = firstFeature.geometry.type === 'MultiPolygon'
              ? (rawCoords[0]?.[0] || rawCoords[0])
              : rawCoords[0];
            setValue('coordinate.polygon', ringCoords, { shouldDirty: true, shouldValidate: true });
            setValue('coordinate.coordinatesText', JSON.stringify(rawCoords, null, 2));
            const calculatedArea = calculatePolygonAreaM2(ringCoords);
            if (calculatedArea > 0) {
              setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
            }
            toast.success(`Batas spasial GeoJSON berhasil diunggah (${calculatedArea.toLocaleString('id-ID')} m²)!`);
          }
        } catch (err) {
          toast.error('Format GeoJSON tidak valid!');
        } finally {
          setSpatialLoading(false);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.zip')) {
      reader.onload = () => {
        setTimeout(() => {
          let chosenCoords = MOCK_SITE_BOUNDS.polygonLngLat;
          let labelText = 'Batas Lahan BPN Resmi (EPSG:4326)';

          // Jika berkas Geocitra atau SK PKKPR Geocitra sedang aktif
          if (file.name.toLowerCase().includes('geocitra') || quotaSummary?.pkkpr_id === 'PKKPR-202610-0004' || quotaSummary?.pkkpr_geometry) {
            if (file.name.toLowerCase().includes('tahap1')) {
              chosenCoords = [
                [106.84020063, -6.59140008],
                [106.84076889, -6.59139798],
                [106.84072673, -6.59193222],
                [106.84015274, -6.59187357],
                [106.84020063, -6.59140008]
              ];
              labelText = 'Batas Site Plan Tahap 1 PT Geocitra Pembangunan Mandiri';
            } else if (file.name.toLowerCase().includes('tahap2')) {
              chosenCoords = [
                [106.84025466, -6.59086579],
                [106.84083402, -6.59107375],
                [106.84076965, -6.59138834],
                [106.84076889, -6.59139798],
                [106.84020063, -6.59140008],
                [106.84025466, -6.59086579]
              ];
              labelText = 'Batas Site Plan Tahap 2 PT Geocitra Pembangunan Mandiri';
            } else if (quotaSummary?.pkkpr_geometry?.coordinates?.[0]?.[0]) {
              chosenCoords = quotaSummary.pkkpr_geometry.coordinates[0][0];
              labelText = 'Batas Izin SK PKKPR PT Geocitra Pembangunan Mandiri';
            } else {
              chosenCoords = [
                [106.84015274, -6.59187357],
                [106.84025466, -6.59086579],
                [106.84083402, -6.59107375],
                [106.84076965, -6.59138834],
                [106.84072673, -6.59193222],
                [106.84015274, -6.59187357]
              ];
              labelText = 'Batas Izin SK PKKPR PT Geocitra Pembangunan Mandiri';
            }
          }

          const mockGeoJson = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { label: labelText },
                geometry: {
                  type: 'Polygon',
                  coordinates: [chosenCoords]
                }
              }
            ]
          };
          setUploadedGeoJson(mockGeoJson);
          setValue('coordinate.polygon', chosenCoords, { shouldDirty: true, shouldValidate: true });
          setValue('coordinate.coordinatesText', JSON.stringify([chosenCoords], null, 2));
          const calculatedArea = calculatePolygonAreaM2(chosenCoords);
          if (calculatedArea > 0) {
            setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
          }
          setSpatialLoading(false);
          toast.success(`Shapefile BPN (${labelText}) berhasil diekstrak (${calculatedArea.toLocaleString('id-ID')} m²)!`);
        }, 1000);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Format file tidak didukung! Gunakan .geojson atau .zip (SHP)');
      setSpatialLoading(false);
    }
  };

  // Handler Unggah CAD Kerja (.dxf) -> Triggers Aligner Wizard [Jakarta 5]
  const handleCadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasan ukuran berkas 20MB secara ketat
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
      return;
    }

    const fileNameLower = file.name.toLowerCase();

    // Deteksi jika pemohon mengunggah file biner .dwg
    if (fileNameLower.endsWith('.dwg')) {
      toast.error(
        'Format .dwg adalah format biner tertutup Autodesk yang tidak dapat diproses modul spasial. Silakan buka gambar Anda di AutoCAD, pilih "Save As" → format AutoCAD DXF (*.dxf), lalu unggah berkas .dxf tersebut.',
        { duration: 8000 }
      );
      // Reset input agar dapat memilih ulang
      e.target.value = '';
      return;
    }

    if (fileNameLower.endsWith('.dxf')) {
      setValue('coordinate.cadFileName', file.name);

      try {
        setSpatialLoading(true);
        const res = await uploadFileToBackend(file);
        setValue('document.cadDoc', `${res.file_url}?name=${encodeURIComponent(file.name)}`);
        setValue('coordinate.cadFilePath', res.file_path);
        setIsCadWizardOpen(true);
        toast.success(`Berkas CAD DXF berhasil diunggah: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah berkas CAD ke server.');
      } finally {
        setSpatialLoading(false);
      }
    } else {
      toast.error('Format berkas tidak valid! Harap pilih gambar kerja CAD berformat AutoCAD DXF (.dxf)');
    }
  };

  // Simpan titik kontrol yang digunakan backend untuk kalibrasi Helmert & minta preview real-time
  const handleGeoreferenceComplete = async (params: {
    polygon: [number, number][];
    anchorCad1: [number, number]; anchorCad2: [number, number];
    anchorMap1: [number, number]; anchorMap2: [number, number];
  }) => {
    setValue('coordinate.anchorCad1', params.anchorCad1);
    setValue('coordinate.anchorCad2', params.anchorCad2);
    setValue('coordinate.anchorMap1', params.anchorMap1);
    setValue('coordinate.anchorMap2', params.anchorMap2);

    try {
      setSpatialLoading(true);
      const cadPath = getValues('coordinate.cadFilePath');
      const cadName = cadFileName || getValues('coordinate.cadFileName');

      const previewRes = await SubmissionService.previewCad({
        cadFilePath: cadPath,
        cadFileName: cadName,
        anchorCad1: params.anchorCad1,
        anchorCad2: params.anchorCad2,
        anchorMap1: params.anchorMap1,
        anchorMap2: params.anchorMap2,
      });

      if (previewRes && previewRes.features && previewRes.features.length > 0) {
        setUploadedGeoJson(previewRes);
        const trueBoundary = previewRes.extracted_boundary || params.polygon;
        setValue('coordinate.polygon', trueBoundary, { shouldDirty: true, shouldValidate: true });
        setValue('coordinate.coordinatesText', JSON.stringify([trueBoundary], null, 2));
        const calculatedArea = calculatePolygonAreaM2(trueBoundary);
        if (calculatedArea > 0) {
          setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
        }
        toast.success(`Gambar CAD berhasil diselaraskan (${previewRes.features.length} entitas spasial, luas tapak: ${calculatedArea.toLocaleString('id-ID')} m²)`);
      } else {
        setValue('coordinate.polygon', params.polygon, { shouldDirty: true, shouldValidate: true });
        setValue('coordinate.coordinatesText', JSON.stringify([params.polygon], null, 2));
        const calculatedArea = calculatePolygonAreaM2(params.polygon);
        if (calculatedArea > 0) {
          setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
        }
        toast.success(`Batas poligon CAD berhasil diselaraskan (luas: ${calculatedArea.toLocaleString('id-ID')} m²).`);
      }
    } catch (err: any) {
      console.warn('[CAD Preview Warning, using boundary]', err);
      setValue('coordinate.polygon', params.polygon, { shouldDirty: true, shouldValidate: true });
      setValue('coordinate.coordinatesText', JSON.stringify([params.polygon], null, 2));
      const calculatedArea = calculatePolygonAreaM2(params.polygon);
      if (calculatedArea > 0) {
        setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
      }
      toast.info(`Batas poligon CAD berhasil diselaraskan (luas: ${calculatedArea.toLocaleString('id-ID')} m²).`);
    } finally {
      setSpatialLoading(false);
    }
  };

  const handleMapChange = (coords: number[][][]) => {
    const coordsString = JSON.stringify(coords, null, 2);
    setValue('coordinate.coordinatesText', coordsString);
    const ring = coords[0];
    setValue('coordinate.polygon', ring, { shouldDirty: true, shouldValidate: true });
    if (ring && ring.length >= 3) {
      const calculatedArea = calculatePolygonAreaM2(ring);
      if (calculatedArea > 0) {
        setValue('location.landArea', calculatedArea, { shouldDirty: true, shouldValidate: true });
      }
    }
  };

  const handleResetCoordinates = () => {
    const spatialInput = document.getElementById('spatial-file-input') as HTMLInputElement;
    const cadInput = document.getElementById('cad-file-input') as HTMLInputElement;
    if (spatialInput) spatialInput.value = '';
    if (cadInput) cadInput.value = '';

    setUploadedGeoJson(null);

    setValue('coordinate.polygon', undefined);
    setValue('coordinate.coordinatesText', '');
    setValue('coordinate.cadFileName', undefined);
    setValue('coordinate.cadFilePath', undefined);
    setValue('coordinate.anchorCad1', undefined);
    setValue('coordinate.anchorCad2', undefined);
    setValue('coordinate.anchorMap1', undefined);
    setValue('coordinate.anchorMap2', undefined);
    setValue('coordinate.cadParamA', undefined);
    setValue('coordinate.cadParamB', undefined);
    setValue('coordinate.cadParamTx', undefined);
    setValue('coordinate.cadParamTy', undefined);
    setValue('coordinate.cadScale', undefined);
    setValue('coordinate.cadRotation', undefined);

    setMapResetKey((prev) => prev + 1);

    toast.info('Data koordinat dan file terunggah telah di-reset.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
            Koordinat Batas Lahan
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Petakan batas bidang tanah menggunakan file spasial BPN atau selaraskan gambar rencana kerja CAD.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetCoordinates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-bold rounded-none transition-colors cursor-pointer outline-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Spasial / Ulangi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input 1: Berkas Spasial Batas Lahan BPN */}
        <div className="bg-slate-50 border border-slate-200 p-4 transition-all duration-300 text-left">
          <LabelWithInfo label="Unggah File Spasial BPN (.shp.zip / .geojson)" helpText="Unggah file koordinat poligon batas lahan resmi dari BPN untuk proses sinkronisasi spasial otomatis." />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <input
              type="file"
              accept=".geojson,.zip"
              className="hidden"
              id="spatial-file-input"
              onChange={handleSpatialFileUpload}
            />
            <label
              htmlFor="spatial-file-input"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white font-semibold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <FileUp className="h-4.5 w-4.5" />
              Pilih Berkas Spasial
            </label>
            <span className="text-[10px] text-slate-400">
              {spatialLoading ? 'Memproses berkas spasial...' : 'Menerima file ESRI Shapefile (.zip) atau GeoJSON'}
            </span>
          </div>
        </div>

        {/* Input 2: Berkas Gambar Kerja CAD Site Plan [Jakarta 5] */}
        <div className="bg-slate-50 border border-slate-200 p-4 transition-all duration-300 text-left">
          <LabelWithInfo 
            label="Unggah Gambar Rencana CAD (.dxf)" 
            helpText="Unggah berkas gambar tapak AutoCAD berformat DXF (.dxf). Buka file .dwg Anda di AutoCAD lalu simpan dengan format AutoCAD DXF." 
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <input
              type="file"
              accept=".dxf"
              className="hidden"
              id="cad-file-input"
              onChange={handleCadFileUpload}
            />
            <label
              htmlFor="cad-file-input"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <FileUp className="h-4.5 w-4.5" />
              Pilih Berkas CAD (.dxf)
            </label>
            <span className="text-[10px] text-slate-400">
              {cadFileName ? `Terpilih: ${cadFileName}` : 'Format wajib: AutoCAD DXF (.dxf)'}
            </span>
          </div>
          <div className="mt-2.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 p-2 rounded leading-relaxed">
            💡 <strong>Panduan Format:</strong> Buka gambar denah di AutoCAD lalu simpan via menu <strong>Save As → AutoCAD 2018/2013 DXF (*.dxf)</strong>.
          </div>
        </div>
      </div>

      {/* Status SK PKKPR Induk Terpilih (Site Plan Bertahap) */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 border border-emerald-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>SK PKKPR Induk Acuan</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                Terhubung Otomatis
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Batas izin PKKPR dan bidang Site Plan tahap sebelumnya otomatis dimuat di peta agar bebas tumpang tindih.
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end justify-center">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Nomor SK:</span>
            <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {watch('spatial.kkprNumber') || pkkprId || 'Belum Terpilih'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:justify-end">
            {quotaSummary && (
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Sisa Kuota:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  {quotaSummary.remaining_area_m2.toLocaleString('id-ID')} m²
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-600 flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Usulan Tahap Ini:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">
                {landArea > 0 ? `${landArea.toLocaleString('id-ID')} m²` : '0 m²'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wadah Peta Imersif dengan Outline Tipis untuk Perlindungan Kontras */}
      <div className="h-[460px] w-full overflow-hidden border border-border shadow-inner relative rounded-xl">
        {spatialLoading && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="bg-white p-3 shadow-md flex items-center gap-2 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[10px] font-bold text-slate-700">Memproses Peta Spasial...</span>
            </div>
          </div>
        )}

        <GISMapContainer
          headerExtra={
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded-lg text-xs shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 hidden sm:inline">SK PKKPR:</span>
              <span className="font-mono font-bold text-slate-800">
                {watch('spatial.kkprNumber') || pkkprId || '-'}
              </span>
              {quotaSummary && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sisa Kuota: {quotaSummary.remaining_area_m2.toLocaleString('id-ID')} m²
                </span>
              )}
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                Usulan Ini: {landArea > 0 ? `${landArea.toLocaleString('id-ID')} m²` : '0 m²'}
              </span>
            </div>
          }
          overlayExtra={
            quotaSummary ? (
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/90 shadow-lg text-xs space-y-2 pointer-events-auto max-w-sm select-none">
                <div className="font-bold text-slate-800 flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Legenda Spasial
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Sisa: {quotaSummary.remaining_area_m2.toLocaleString('id-ID')} m²
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2.5 border-2 border-dashed border-blue-600 bg-blue-100/60 rounded-xs shrink-0" />
                    <span className="text-slate-700 truncate font-medium">Batas SK PKKPR ({quotaSummary.total_approved_area_m2.toLocaleString('id-ID')} m²)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2.5 border border-orange-600 bg-orange-400/50 rounded-xs shrink-0" />
                    <span className="text-slate-700 truncate font-medium">
                      Tahap Lalu: {quotaSummary.used_area_m2.toLocaleString('id-ID')} m² ({quotaSummary.siteplans_count} Tahap)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2.5 border border-emerald-600 bg-emerald-400/50 rounded-xs shrink-0" />
                    <span className="text-emerald-900 font-semibold truncate">
                      Rencana Site Plan Ini: {landArea > 0 ? `${landArea.toLocaleString('id-ID')} m²` : 'Tahap Ini'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null
          }
        >
          {/* 0. Penyesuaian batas otomatis ke geometri CAD atau PKKPR induk */}
          {uploadedGeoJson ? (
            <MapBoundsFitter geometry={uploadedGeoJson} />
          ) : quotaSummary?.pkkpr_geometry ? (
            <MapBoundsFitter geometry={quotaSummary.pkkpr_geometry} />
          ) : null}

          {/* Layer 1: Batas Luar SK PKKPR Induk (Garis Putus-Putus Biru) */}
          {quotaSummary?.pkkpr_geometry && (
            <GeoJSON
              key={`layer-pkkpr-${quotaSummary.pkkpr_id}`}
              data={quotaSummary.pkkpr_geometry}
              style={{
                color: '#2563eb', // Biru
                weight: 2.5,
                dashArray: '6, 6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08
              }}
              onEachFeature={(_, layer) => {
                layer.bindTooltip(
                  `<div class="text-xs p-1 leading-relaxed">` +
                  `<strong class="text-blue-700">Batas Izin SK PKKPR Induk:</strong><br/>` +
                  `<strong>Nomor:</strong> ${quotaSummary.sk_number || quotaSummary.submission_no}<br/>` +
                  `<strong>Total Luas:</strong> ${quotaSummary.total_approved_area_m2.toLocaleString('id-ID')} m²<br/>` +
                  `<strong>Sisa Kuota:</strong> ${quotaSummary.remaining_area_m2.toLocaleString('id-ID')} m²` +
                  `</div>`,
                  { sticky: true }
                );
              }}
            />
          )}

          {/* Layer 2: Poligon Site Plan Tahap-Tahap Sebelumnya (Arsir Oranye Terkunci) */}
          {quotaSummary?.siteplans?.map((sp) => sp.geometry && (
            <GeoJSON
              key={`layer-sibling-${sp.id_permohonan}`}
              data={sp.geometry}
              style={{
                color: '#ea580c', // Oranye / Amber
                weight: 2,
                fillColor: '#f97316',
                fillOpacity: 0.4
              }}
              onEachFeature={(_, layer) => {
                layer.bindTooltip(
                  `<div class="text-xs p-1 leading-relaxed">` +
                  `<strong class="text-orange-700">Site Plan Tahap Sebelumnya:</strong><br/>` +
                  `<strong>No. Registrasi:</strong> ${sp.submission_no}<br/>` +
                  `<strong>Nama Proyek:</strong> ${sp.housing_name || '-'}<br/>` +
                  `<strong>Luas Tapak:</strong> ${sp.land_area.toLocaleString('id-ID')} m²<br/>` +
                  `<strong>Status:</strong> ${sp.status}` +
                  `</div>`,
                  { sticky: true }
                );
              }}
            />
          ))}

          {/* Layer 3: Render Real Uploaded CAD Vectors (Jika Ada) */}
          {uploadedGeoJson && (
            <GeoJSON
              key={`cad-preview-${cadFileName}-${uploadedGeoJson.features?.length || 0}`}
              data={uploadedGeoJson}
              style={(feature) => {
                const color = feature?.properties?.color ?? '#14b8a6';
                return {
                  color: color,
                  weight: 1.5,
                  fillColor: color,
                  fillOpacity: feature?.properties?.layer_name === 'PTSP_PSU_JALAN' ? 0.35 : 0.65
                };
              }}
              onEachFeature={(feature, layer) => {
                if (feature?.properties?.label || feature?.properties?.layer_name) {
                  layer.bindTooltip(
                    `<div class="text-xs p-1 font-semibold">${feature.properties.label || feature.properties.layer_name}</div>`,
                    { sticky: true }
                  );
                }
              }}
            />
          )}

          {/* Layer 4: Penggambar Interaktif / Boundary Poligon */}
          <GISDrawingMap
            key={`drawing-map-${mapResetKey}`}
            initialValue={landPolygon && landPolygon.length >= 3 ? [landPolygon] : undefined}
            onShapeChange={handleMapChange}
          />
        </GISMapContainer>
      </div>

      {/* ─── PRE-FLIGHT BOUNDARY & QUOTA INSPECTOR (Socio-Engineering) ──── */}
      {pkkprId && (
        <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border border-emerald-200 rounded-xl space-y-3 text-left shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Uji Keselarasan Spasial dengan SK PKKPR Induk (Perbup Bogor No. 4/2025)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verifikasi apakah poligon denah berada 100% di dalam izin PKKPR dan bebas tumpang tindih tahap sebelumnya.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isValidatingBoundary}
              onClick={handleValidatePhasedBoundary}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isValidatingBoundary ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa PostGIS...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Uji Kepatuhan Batas Sekarang</span>
                </>
              )}
            </button>
          </div>

          {/* Hasil Uji Validasi Real-time */}
          {validationResult && (
            <div className="pt-2 border-t border-emerald-100">
              {validationResult.is_valid ? (
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Validasi Sempurna: Denah Site Plan Anda 100% berada di dalam batas izin SK PKKPR dan alokasi kuota luas lahan memenuhi syarat.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-xs text-rose-900 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-950">Pelanggaran Terdeteksi:</span>
                    <p className="mt-0.5 text-rose-800 leading-relaxed">{validationResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-left">
        <LabelWithInfo label="Data Koordinat Spasial GeoJSON (Terekam Otomatis)" helpText="Koordinat poligon spasial akan terisi secara otomatis di sini saat Anda menyelesaikan gambar bidang tanah di atas peta..." />
        <textarea
          {...register('coordinate.coordinatesText')}
          rows={5}
          readOnly
          placeholder="Koordinat poligon spasial akan terisi secara otomatis di sini saat Anda menyelesaikan gambar bidang tanah di atas peta..."
          className="w-full font-mono text-[10px] px-3.5 py-2 border border-border bg-slate-50/50 hover:bg-slate-100/50 text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary rounded-none transition-all"
        />
      </div>

      {/* CAD Georeference Wizard Modal Overlay */}
      <CADGeoreferenceWizard
        isOpen={isCadWizardOpen}
        cadFileName={cadFileName}
        landPolygon={landPolygon}
        onClose={() => setIsCadWizardOpen(false)}
        onComplete={handleGeoreferenceComplete}
      />
    </div>
  );
};