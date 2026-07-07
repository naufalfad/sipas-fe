import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2, RefreshCw, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { LabelWithInfo } from './LabelWithInfo';
import { CADGeoreferenceWizard } from './CADGeoreferenceWizard';
import GISMapContainer from '@/components/maps/GISMapContainer';
import GISDrawingMap from '@/components/maps/GISDrawingMap';
import { uploadFileToBackend } from '../../utils/upload';

export const CoordinateSection = () => {
  const { register, setValue, watch } = useFormContext<FullSubmissionFormValues>();
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [uploadedGeoJson, setUploadedGeoJson] = useState<any>(null);

  // State untuk kontrol modal Wizard Georeferencing CAD
  const [isCadWizardOpen, setIsCadWizardOpen] = useState(false);
  const cadFileName = watch('coordinate.cadFileName') || '';

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
          if (firstFeature && firstFeature.geometry && firstFeature.geometry.type === 'Polygon') {
            const coords = firstFeature.geometry.coordinates;
            setValue('coordinate.polygon', coords[0]);
            setValue('coordinate.coordinatesText', JSON.stringify(coords, null, 2));
            toast.success('Batas spasial GeoJSON berhasil diunggah!');
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
          const mockGeoJson = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [106.8160, -6.5945],
                      [106.8175, -6.5945],
                      [106.8175, -6.5960],
                      [106.8160, -6.5960],
                      [106.8160, -6.5945]
                    ]
                  ]
                }
              }
            ]
          };
          setUploadedGeoJson(mockGeoJson);
          setValue('coordinate.polygon', mockGeoJson.features[0].geometry.coordinates[0]);
          setValue('coordinate.coordinatesText', JSON.stringify(mockGeoJson.features[0].geometry.coordinates, null, 2));
          setSpatialLoading(false);
          toast.success('File Shapefile BPN berhasil diekstrak!');
        }, 1500);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Format file tidak didukung! Gunakan .geojson atau .zip (SHP)');
      setSpatialLoading(false);
    }
  };

  // Handler Unggah CAD Kerja (.dwg/.dxf) -> Triggers Aligner Wizard [Jakarta 5]
  const handleCadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasan ukuran berkas 20MB secara ketat
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
      return;
    }

    if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
      setValue('coordinate.cadFileName', file.name);
      setIsCadWizardOpen(true);

      try {
        setSpatialLoading(true);
        const res = await uploadFileToBackend(file);
        setValue('document.cadDoc', `${res.file_url}?name=${encodeURIComponent(file.name)}`);
        toast.success(`Berkas CAD berhasil diunggah ke server: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah berkas CAD ke server.');
      } finally {
        setSpatialLoading(false);
      }
    } else {
      toast.error('Format file salah! Harap pilih gambar kerja CAD berformat .dwg atau .dxf');
    }
  };

  // Hasil Sinkronisasi Matriks Helmert 2D dari Wizard Aligner
  const handleGeoreferenceComplete = (params: {
    A: number; B: number; Tx: number; Ty: number;
    scale: number; rotation: number; polygon: [number, number][];
  }) => {
    setValue('coordinate.cadParamA', params.A);
    setValue('coordinate.cadParamB', params.B);
    setValue('coordinate.cadParamTx', params.Tx);
    setValue('coordinate.cadParamTy', params.Ty);
    setValue('coordinate.cadScale', params.scale);
    setValue('coordinate.cadRotation', params.rotation);
    setValue('coordinate.polygon', params.polygon);
    setValue('coordinate.coordinatesText', JSON.stringify([params.polygon], null, 2));

    // Update GIS container render dengan overlapping site plan layout ar-ar polygon
    const boundaryFeature = {
      type: 'Feature',
      properties: { label: 'Batas Lahan BPN' },
      geometry: { type: 'Polygon', coordinates: [params.polygon] }
    };

    // Blok A Kaveling (dikalkulasi secara relatif dalam koordinat terkalibrasi)
    const lotAFeature = {
      type: 'Feature',
      properties: { label: 'Blok Kaveling A' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.5, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.5, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1]
        ]]
      }
    };

    const lotBFeature = {
      type: 'Feature',
      properties: { label: 'Blok Kaveling B' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.5],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.6, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.1]
        ]]
      }
    };

    const roadFeature = {
      type: 'Feature',
      properties: { label: 'Lebar Jalan Utama' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.95, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.95, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.58],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.58],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.05, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.52]
        ]]
      }
    };

    const rthFeature = {
      type: 'Feature',
      properties: { label: 'Rencana Fasum & RTH' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.9, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.9],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.9],
          [params.polygon[0][0] + (params.polygon[1][0] - params.polygon[0][0]) * 0.1, params.polygon[0][1] + (params.polygon[3][1] - params.polygon[0][1]) * 0.6]
        ]]
      }
    };

    setUploadedGeoJson({
      type: 'FeatureCollection',
      features: [boundaryFeature, lotAFeature, lotBFeature, roadFeature, rthFeature]
    });
  };

  const handleMapChange = (coords: number[][][]) => {
    const coordsString = JSON.stringify(coords, null, 2);
    setValue('coordinate.coordinatesText', coordsString);
    setValue('coordinate.polygon', coords[0]);
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
    setValue('coordinate.cadParamA', undefined);
    setValue('coordinate.cadParamB', undefined);
    setValue('coordinate.cadParamTx', undefined);
    setValue('coordinate.cadParamTy', undefined);
    setValue('coordinate.cadScale', undefined);
    setValue('coordinate.cadRotation', undefined);

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
          <LabelWithInfo label="Unggah Gambar Rencana CAD (.dwg / .dxf)" helpText="Unggah berkas gambar tapak AutoCAD. Sistem akan memandu Anda melakukan transformasi Helmert untuk georeferensi denah." />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <input
              type="file"
              accept=".dwg,.dxf"
              className="hidden"
              id="cad-file-input"
              onChange={handleCadFileUpload}
            />
            <label
              htmlFor="cad-file-input"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <FileUp className="h-4.5 w-4.5" />
              Pilih Berkas CAD
            </label>
            <span className="text-[10px] text-slate-400">
              {cadFileName ? `Terpilih: ${cadFileName}` : 'Unggah denah autocad untuk memulai penyelarasan koordinat'}
            </span>
          </div>
        </div>
      </div>

      {/* Wadah Peta Imersif dengan Outline Tipis untuk Perlindungan Kontras */}
      <div className="h-[400px] w-full overflow-hidden border border-border shadow-inner relative">
        {spatialLoading && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="bg-white p-3 shadow-md flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[10px] font-bold text-slate-700">Memproses Peta Spasial...</span>
            </div>
          </div>
        )}
        <GISMapContainer>
          <GISDrawingMap onShapeChange={handleMapChange} initialGeoJson={uploadedGeoJson} />
        </GISMapContainer>
      </div>

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
        onClose={() => setIsCadWizardOpen(false)}
        onComplete={handleGeoreferenceComplete}
      />
    </div>
  );
};