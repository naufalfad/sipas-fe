import { Source, Layer } from 'react-map-gl/maplibre';

interface SpatialGeoJSONLayersProps {
  opacity: number;
  localZoom: number;
  selectedCompanyId: string | null;
  // Overlays show flags
  showPemukiman: boolean;
  showKontur: boolean;
  showSungai: boolean;
  showSawah: boolean;
  showPasir: boolean;
  showKebun: boolean;
  showLadang: boolean;
  showAdministrasi: boolean;
  showDesa: boolean;
  showDanau: boolean;
  showJalan: boolean;
  showTanamCampur: boolean;
  showHutanKering: boolean;
  showAlang: boolean;
  showSemak: boolean;
  showPunggungBukit: boolean;
  showRelka: boolean;
  showDetail: boolean;
  isDroneLayerActive: boolean;
  droneLayerOpacity: number;
  bangunanTolerance: number;
  // GeoJSON Datas
  pemukimanData: any;
  konturData: any;
  sungaiData: any;
  sawahData: any;
  pasirData: any;
  kebunData: any;
  ladangData: any;
  administrasiData: any;
  desaData: any;
  danauData: any;
  jalanData: any;
  tanamCampurData: any;
  hutanKeringData: any;
  alangData: any;
  semakData: any;
  punggungBukitData: any;
  relkaData: any;
  bangunanData: any;
  submissionsGeoJSON: any;
  subPolygonsGeoJSON: any;
  compensationGeoJSON: any;
  clashGeoJSON: any;
}

function vis(active: boolean): 'visible' | 'none' {
  return active ? 'visible' : 'none';
}

export const SpatialGeoJSONLayers = ({
  opacity,
  localZoom,
  selectedCompanyId,
  showPemukiman,
  showKontur,
  showSungai,
  showSawah,
  showPasir,
  showKebun,
  showLadang,
  showAdministrasi,
  showDesa,
  showDanau,
  showJalan,
  showTanamCampur,
  showHutanKering,
  showAlang,
  showSemak,
  showPunggungBukit,
  showRelka,
  showDetail,
  isDroneLayerActive,
  droneLayerOpacity,
  bangunanTolerance,
  pemukimanData,
  konturData,
  sungaiData,
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
  bangunanData,
  submissionsGeoJSON,
  subPolygonsGeoJSON,
  compensationGeoJSON,
  clashGeoJSON,
}: SpatialGeoJSONLayersProps) => {
  return (
    <>
      {/* ─── LAYER DRONE ORTHOPHOTO OVERLAY ─── */}
      {isDroneLayerActive && (
        <Source
          id="drone-orthophoto-source"
          type="raster"
          tiles={['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']}
          tileSize={256}
        >
          <Layer
            id="drone-orthophoto-layer"
            type="raster"
            paint={{ 'raster-opacity': droneLayerOpacity / 100 }}
            beforeId="submissions-fill-flat"
          />
        </Source>
      )}

      {showPemukiman && pemukimanData && (
        <Source key="pemukiman-source" id="pemukiman" type="geojson" data={pemukimanData}>
          <Layer id="pemukiman-fill" type="fill"
            layout={{ visibility: vis(showPemukiman) }}
            paint={{ 'fill-color': '#06b6d4', 'fill-opacity': 0.35 * opacity }}
          />
          <Layer id="pemukiman-outline" type="line"
            layout={{ visibility: vis(showPemukiman) }}
            paint={{ 'line-color': '#0891b2', 'line-width': 1, 'line-opacity': 0.6 * opacity }}
          />
        </Source>
      )}

      {showKontur && konturData && (
        <Source key="kontur-source" id="kontur" type="geojson" data={konturData}>
          <Layer id="kontur-line" type="line"
            layout={{ visibility: vis(showKontur) }}
            paint={{
              'line-color': '#fbbf24', 'line-width': 1,
              'line-opacity': 0.8 * opacity, 'line-dasharray': [4, 2],
            }}
          />
        </Source>
      )}

      {showSungai && sungaiData && (
        <Source key="sungai-source" id="sungai" type="geojson" data={sungaiData}>
          <Layer id="sungai-casing" type="line"
            layout={{ visibility: vis(showSungai) }}
            paint={{ 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 0.5 * opacity }}
          />
          <Layer id="sungai-line" type="line"
            layout={{ visibility: vis(showSungai) }}
            paint={{ 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 0.9 * opacity }}
          />
        </Source>
      )}

      {showSawah && sawahData && (
        <Source key="sawah-source" id="sawah" type="geojson" data={sawahData}>
          <Layer id="sawah-fill" type="fill"
            layout={{ visibility: vis(showSawah) }}
            paint={{ 'fill-color': '#34d399', 'fill-opacity': 0.3 * opacity }}
          />
          <Layer id="sawah-outline" type="line"
            layout={{ visibility: vis(showSawah) }}
            paint={{ 'line-color': '#059669', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {showPasir && pasirData && (
        <Source key="pasir-source" id="pasir" type="geojson" data={pasirData}>
          <Layer id="pasir-fill" type="fill"
            layout={{ visibility: vis(showPasir) }}
            paint={{ 'fill-color': '#fed7aa', 'fill-opacity': 0.3 * opacity }}
          />
          <Layer id="pasir-outline" type="line"
            layout={{ visibility: vis(showPasir) }}
            paint={{ 'line-color': '#ea580c', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {showKebun && kebunData && (
        <Source key="kebun-source" id="kebun" type="geojson" data={kebunData}>
          <Layer id="kebun-fill" type="fill"
            layout={{ visibility: vis(showKebun) }}
            paint={{ 'fill-color': '#15803d', 'fill-opacity': 0.3 * opacity }}
          />
          <Layer id="kebun-outline" type="line"
            layout={{ visibility: vis(showKebun) }}
            paint={{ 'line-color': '#166534', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {showLadang && ladangData && (
        <Source key="ladang-source" id="ladang" type="geojson" data={ladangData}>
          <Layer id="ladang-fill" type="fill"
            layout={{ visibility: vis(showLadang) }}
            paint={{ 'fill-color': '#84cc16', 'fill-opacity': 0.3 * opacity }}
          />
          <Layer id="ladang-outline" type="line"
            layout={{ visibility: vis(showLadang) }}
            paint={{ 'line-color': '#65a30d', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER BATAS ADMINISTRASI KABUPATEN ─── */}
      {showAdministrasi && administrasiData && (
        <Source key="administrasi-source" id="administrasi" type="geojson" data={administrasiData}>
          <Layer id="administrasi-line" type="line"
            layout={{ visibility: vis(showAdministrasi) }}
            paint={{ 'line-color': '#ef4444', 'line-width': 2, 'line-opacity': 0.8 * opacity, 'line-dasharray': [6, 3] }}
          />
        </Source>
      )}

      {/* ─── LAYER BATAS DESA/KELURAHAN ─── */}
      {showDesa && desaData && (
        <Source key="desa-source" id="desa" type="geojson" data={desaData}>
          <Layer id="desa-fill" type="fill"
            layout={{ visibility: vis(showDesa) }}
            paint={{ 'fill-color': '#fb923c', 'fill-opacity': 0.08 * opacity }}
          />
          <Layer id="desa-outline" type="line"
            layout={{ visibility: vis(showDesa) }}
            paint={{ 'line-color': '#ea580c', 'line-width': 1, 'line-opacity': 0.7 * opacity, 'line-dasharray': [3, 2] }}
          />
        </Source>
      )}

      {/* ─── LAYER DANAU / BADAN AIR ─── */}
      {showDanau && danauData && (
        <Source key="danau-source" id="danau" type="geojson" data={danauData}>
          <Layer id="danau-fill" type="fill"
            layout={{ visibility: vis(showDanau) }}
            paint={{ 'fill-color': '#38bdf8', 'fill-opacity': 0.5 * opacity }}
          />
          <Layer id="danau-outline" type="line"
            layout={{ visibility: vis(showDanau) }}
            paint={{ 'line-color': '#0ea5e9', 'line-width': 1.5, 'line-opacity': 0.9 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER JARINGAN JALAN ─── */}
      {showJalan && jalanData && (
        <Source key="jalan-source" id="jalan" type="geojson" data={jalanData}>
          <Layer id="jalan-casing" type="line"
            layout={{ visibility: vis(showJalan) }}
            paint={{ 'line-color': '#94a3b8', 'line-width': 4, 'line-opacity': 0.4 * opacity }}
          />
          <Layer id="jalan-line" type="line"
            layout={{ visibility: vis(showJalan) }}
            paint={{ 'line-color': '#f5f5f4', 'line-width': 2, 'line-opacity': 0.85 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER TANAM CAMPUR ─── */}
      {showTanamCampur && tanamCampurData && (
        <Source key="tanamcampur-source" id="tanamcampur" type="geojson" data={tanamCampurData}>
          <Layer id="tanamcampur-fill" type="fill"
            layout={{ visibility: vis(showTanamCampur) }}
            paint={{ 'fill-color': '#2dd4bf', 'fill-opacity': 0.25 * opacity }}
          />
          <Layer id="tanamcampur-outline" type="line"
            layout={{ visibility: vis(showTanamCampur) }}
            paint={{ 'line-color': '#0d9488', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER HUTAN KERING ─── */}
      {showHutanKering && hutanKeringData && (
        <Source key="hutankering-source" id="hutankering" type="geojson" data={hutanKeringData}>
          <Layer id="hutankering-fill" type="fill"
            layout={{ visibility: vis(showHutanKering) }}
            paint={{ 'fill-color': '#14532d', 'fill-opacity': 0.35 * opacity }}
          />
          <Layer id="hutankering-outline" type="line"
            layout={{ visibility: vis(showHutanKering) }}
            paint={{ 'line-color': '#052e16', 'line-width': 1, 'line-opacity': 0.6 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER ALANG-ALANG ─── */}
      {showAlang && alangData && (
        <Source key="alang-source" id="alang" type="geojson" data={alangData}>
          <Layer id="alang-fill" type="fill"
            layout={{ visibility: vis(showAlang) }}
            paint={{ 'fill-color': '#fcd34d', 'fill-opacity': 0.25 * opacity }}
          />
          <Layer id="alang-outline" type="line"
            layout={{ visibility: vis(showAlang) }}
            paint={{ 'line-color': '#f59e0b', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER SEMAK BELUKAR ─── */}
      {showSemak && semakData && (
        <Source key="semak-source" id="semak" type="geojson" data={semakData}>
          <Layer id="semak-fill" type="fill"
            layout={{ visibility: vis(showSemak) }}
            paint={{ 'fill-color': '#d97706', 'fill-opacity': 0.25 * opacity }}
          />
          <Layer id="semak-outline" type="line"
            layout={{ visibility: vis(showSemak) }}
            paint={{ 'line-color': '#b45309', 'line-width': 1, 'line-opacity': 0.5 * opacity }}
          />
        </Source>
      )}

      {/* ─── LAYER PUNGGUNG BUKIT (RIDGE LINE) ─── */}
      {showPunggungBukit && punggungBukitData && (
        <Source key="punggungbukit-source" id="punggungbukit" type="geojson" data={punggungBukitData}>
          <Layer id="punggungbukit-line" type="line"
            layout={{ visibility: vis(showPunggungBukit) }}
            paint={{ 'line-color': '#a855f7', 'line-width': 1.5, 'line-opacity': 0.7 * opacity, 'line-dasharray': [2, 3] }}
          />
        </Source>
      )}

      {/* ─── LAYER REL KERETA API ─── */}
      {showRelka && relkaData && (
        <Source key="relka-source" id="relka" type="geojson" data={relkaData}>
          <Layer id="relka-casing" type="line"
            layout={{ visibility: vis(showRelka) }}
            paint={{ 'line-color': '#1e293b', 'line-width': 5, 'line-opacity': 0.5 * opacity }}
          />
          <Layer id="relka-line" type="line"
            layout={{ visibility: vis(showRelka) }}
            paint={{ 'line-color': '#e2e8f0', 'line-width': 2, 'line-opacity': 0.9 * opacity, 'line-dasharray': [8, 4] }}
          />
        </Source>
      )}

      {bangunanData && localZoom >= 14 && (
        <Source key="bangunan-source" id="bangunan" type="geojson" data={bangunanData}
          tolerance={bangunanTolerance}>
          <Layer id="bangunan-fill-flat" type="fill" maxzoom={17}
            paint={{ 'fill-color': '#94a3b8', 'fill-opacity': 0.4 * opacity }}
          />
          <Layer id="bangunan-extrusion" type="fill-extrusion" minzoom={17}
            paint={{
              'fill-extrusion-color': '#94a3b8', 'fill-extrusion-height': 8,
              'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.6 * opacity,
            }}
          />
        </Source>
      )}

      <Source key="submissions-source" id="submissions" type="geojson" data={submissionsGeoJSON} generateId={true}>
        <Layer id="submissions-fill-flat" type="fill"
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': [
              'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
              0.6, 0.35 * opacity,
            ],
          }}
        />
        <Layer id="submissions-outline-flat" type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': [
              'case', ['==', ['get', 'id'], selectedCompanyId ?? ''], 3, 1.5,
            ],
            'line-opacity': opacity,
          }}
        />
      </Source>

      {showDetail && (
        <Source key="sub-polygons-source" id="sub-polygons" type="geojson" data={subPolygonsGeoJSON}>
          <Layer id="sub-poly-fill" type="fill"
            paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.5 * opacity }}
          />
          <Layer id="sub-poly-outline" type="line"
            paint={{ 'line-color': ['get', 'color'], 'line-width': 1, 'line-opacity': 0.8 * opacity }}
          />
          <Layer id="sub-poly-extrusion" type="fill-extrusion"
            filter={['any', ['==', ['get', 'type'], 'kavling'], ['==', ['get', 'type'], 'psu']]}
            paint={{
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': [
                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                ['*', ['get', 'height'], 1.5], ['get', 'height']
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.75 * opacity,
            }}
          />
          <Layer id="sub-poly-roof-tiers" type="fill-extrusion"
            filter={['==', ['get', 'type'], 'roof-tier']}
            paint={{
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-base': [
                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                ['*', ['get', 'base'], 1.5], ['get', 'base']
              ],
              'fill-extrusion-height': [
                'case', ['==', ['get', 'id'], selectedCompanyId ?? ''],
                ['*', ['get', 'height'], 1.5], ['get', 'height']
              ],
              'fill-extrusion-opacity': 0.95 * opacity,
            }}
          />
        </Source>
      )}

      {/* ─── LAYER RENDERING POLIGON LAHAN KOMPENSASI ─── */}
      {compensationGeoJSON && (
        <Source key="compensation-source" id="compensation-source" type="geojson" data={compensationGeoJSON}>
          <Layer
            id="compensation-fill"
            type="fill"
            paint={{
              'fill-color': '#10b981', // emerald-500
              'fill-opacity': 0.45 * opacity
            }}
          />
          <Layer
            id="compensation-outline"
            type="line"
            paint={{
              'line-color': '#047857', // emerald-700
              'line-width': 2.5,
              'line-dasharray': [3, 2]
            }}
          />
        </Source>
      )}

      {clashGeoJSON && (
        <Source key="clash-source" id="clash" type="geojson" data={clashGeoJSON}>
          <Layer id="clash-fill" type="fill"
            paint={{ 'fill-color': '#ef4444', 'fill-opacity': 0.5 }}
          />
          <Layer id="clash-outline" type="line"
            paint={{
              'line-color': '#ff0000', 'line-width': 3,
              'line-opacity': 1, 'line-dasharray': [4, 3],
            }}
          />
        </Source>
      )}
    </>
  );
};
