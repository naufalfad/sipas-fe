import { GeoJSON } from 'react-leaflet';
import type { PathOptions, StyleFunction } from 'leaflet';

interface SpatialGeoJSONLayersProps {
  opacity: number;
  localZoom: number;
  selectedCompanyId: string | null;
  // Overlay show flags
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
  bangunanData: any;
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
  submissionsGeoJSON: any;
  subPolygonsGeoJSON: any;
  compensationGeoJSON: any;
  clashGeoJSON: any;
  onSubmissionClick?: (id: string, sub: any) => void;
}

// ─── Helper: layer style factories ────────────────────────────────────────────

function fillStyle(color: string, fillOpacity: number, strokeColor: string, weight: number, opacity: number): PathOptions {
  return {
    color: strokeColor,
    weight,
    opacity,
    fillColor: color,
    fillOpacity,
  };
}

function lineStyle(color: string, weight: number, opacity: number, dashArray?: string): PathOptions {
  return {
    color,
    weight,
    opacity,
    fillOpacity: 0,
    dashArray,
  };
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
  bangunanData,
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
  submissionsGeoJSON,
  subPolygonsGeoJSON,
  compensationGeoJSON,
  clashGeoJSON,
  onSubmissionClick,
}: SpatialGeoJSONLayersProps) => {
  return (
    <>
      {/* ─── PEMUKIMAN ─── */}
      {showPemukiman && pemukimanData && (
        <GeoJSON
          key={`pemukiman-${localZoom}`}
          data={pemukimanData}
          style={fillStyle('#06b6d4', 0.35 * opacity, '#0891b2', 1, 0.6 * opacity)}
        />
      )}

      {/* ─── KONTUR ─── */}
      {showKontur && konturData && (
        <GeoJSON
          key={`kontur-${localZoom}`}
          data={konturData}
          style={lineStyle('#fbbf24', 1, 0.8 * opacity, '4 2')}
        />
      )}

      {/* ─── SUNGAI ─── */}
      {showSungai && sungaiData && (
        <GeoJSON
          key={`sungai-${localZoom}`}
          data={sungaiData}
          style={lineStyle('#3b82f6', 3, 0.9 * opacity)}
        />
      )}

      {/* ─── SAWAH ─── */}
      {showSawah && sawahData && (
        <GeoJSON
          key={`sawah-${localZoom}`}
          data={sawahData}
          style={fillStyle('#34d399', 0.3 * opacity, '#059669', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── PASIR ─── */}
      {showPasir && pasirData && (
        <GeoJSON
          key={`pasir-${localZoom}`}
          data={pasirData}
          style={fillStyle('#fed7aa', 0.3 * opacity, '#ea580c', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── KEBUN ─── */}
      {showKebun && kebunData && (
        <GeoJSON
          key={`kebun-${localZoom}`}
          data={kebunData}
          style={fillStyle('#15803d', 0.3 * opacity, '#166534', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── LADANG ─── */}
      {showLadang && ladangData && (
        <GeoJSON
          key={`ladang-${localZoom}`}
          data={ladangData}
          style={fillStyle('#84cc16', 0.3 * opacity, '#65a30d', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── BATAS ADMINISTRASI ─── */}
      {showAdministrasi && administrasiData && (
        <GeoJSON
          key={`administrasi-${localZoom}`}
          data={administrasiData}
          style={lineStyle('#ef4444', 2, 0.8 * opacity, '6 3')}
        />
      )}

      {/* ─── BATAS DESA ─── */}
      {showDesa && desaData && (
        <GeoJSON
          key={`desa-${localZoom}`}
          data={desaData}
          style={fillStyle('#fb923c', 0.08 * opacity, '#ea580c', 1, 0.7 * opacity)}
        />
      )}

      {/* ─── DANAU ─── */}
      {showDanau && danauData && (
        <GeoJSON
          key={`danau-${localZoom}`}
          data={danauData}
          style={fillStyle('#38bdf8', 0.5 * opacity, '#0ea5e9', 1.5, 0.9 * opacity)}
        />
      )}

      {/* ─── JALAN ─── */}
      {showJalan && jalanData && (
        <GeoJSON
          key={`jalan-${localZoom}`}
          data={jalanData}
          style={lineStyle('#f5f5f4', 2, 0.85 * opacity)}
        />
      )}

      {/* ─── TANAM CAMPUR ─── */}
      {showTanamCampur && tanamCampurData && (
        <GeoJSON
          key={`tanamcampur-${localZoom}`}
          data={tanamCampurData}
          style={fillStyle('#2dd4bf', 0.25 * opacity, '#0d9488', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── HUTAN KERING ─── */}
      {showHutanKering && hutanKeringData && (
        <GeoJSON
          key={`hutankering-${localZoom}`}
          data={hutanKeringData}
          style={fillStyle('#14532d', 0.35 * opacity, '#052e16', 1, 0.6 * opacity)}
        />
      )}

      {/* ─── ALANG-ALANG ─── */}
      {showAlang && alangData && (
        <GeoJSON
          key={`alang-${localZoom}`}
          data={alangData}
          style={fillStyle('#fcd34d', 0.25 * opacity, '#f59e0b', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── SEMAK BELUKAR ─── */}
      {showSemak && semakData && (
        <GeoJSON
          key={`semak-${localZoom}`}
          data={semakData}
          style={fillStyle('#d97706', 0.25 * opacity, '#b45309', 1, 0.5 * opacity)}
        />
      )}

      {/* ─── PUNGGUNG BUKIT ─── */}
      {showPunggungBukit && punggungBukitData && (
        <GeoJSON
          key={`punggungbukit-${localZoom}`}
          data={punggungBukitData}
          style={lineStyle('#a855f7', 1.5, 0.7 * opacity, '2 3')}
        />
      )}

      {/* ─── REL KERETA ─── */}
      {showRelka && relkaData && (
        <GeoJSON
          key={`relka-${localZoom}`}
          data={relkaData}
          style={lineStyle('#e2e8f0', 2, 0.9 * opacity, '8 4')}
        />
      )}

      {/* ─── BANGUNAN (zoom >= 14) ─── */}
      {bangunanData && localZoom >= 14 && (
        <GeoJSON
          key={`bangunan-${localZoom}`}
          data={bangunanData}
          style={fillStyle('#94a3b8', 0.4 * opacity, '#64748b', 0.5, 0.3 * opacity)}
        />
      )}

      {/* ─── LAYER PENGAJUAN (submissions) ─── */}
      {submissionsGeoJSON && (
        <GeoJSON
          key={`submissions-${selectedCompanyId}`}
          data={submissionsGeoJSON}
          style={(feature) => {
            const color = feature?.properties?.color ?? '#6b7280';
            const isSelected = feature?.properties?.id === selectedCompanyId;
            return {
              color,
              weight: isSelected ? 3 : 1.5,
              opacity,
              fillColor: color,
              fillOpacity: isSelected ? 0.6 : 0.35 * opacity,
            };
          }}
          onEachFeature={(feature, layer) => {
            layer.on('click', () => {
              if (feature.properties?.id && onSubmissionClick) {
                onSubmissionClick(feature.properties.id, feature.properties);
              }
            });
          }}
        />
      )}

      {/* ─── SITEPLAN DETAIL (internal SHP / CAD vectors) ─── */}
      {subPolygonsGeoJSON && subPolygonsGeoJSON.features?.length > 0 && (
        <GeoJSON
          key={`sub-polygons-${selectedCompanyId}`}
          data={subPolygonsGeoJSON}
          style={(feature) => ({
            color: feature?.properties?.color ?? '#6b7280',
            weight: 1,
            opacity: 0.95 * opacity,
            fillColor: feature?.properties?.color ?? '#6b7280',
            fillOpacity: feature?.properties?.type === 'road' ? 0.4 * opacity : 0.55 * opacity,
          })}
        />
      )}

      {/* ─── KOMPENSASI LAHAN ─── */}
      {compensationGeoJSON && (
        <GeoJSON
          key="compensation"
          data={compensationGeoJSON}
          style={fillStyle('#10b981', 0.45 * opacity, '#047857', 2.5, 1)}
        />
      )}

      {/* ─── CLASH / KONFLIK SPASIAL ─── */}
      {clashGeoJSON && (
        <GeoJSON
          key="clash"
          data={clashGeoJSON}
          style={lineStyle('#ff0000', 3, 1, '4 3')}
        />
      )}
    </>
  );
};
