import { useMemo } from 'react';
import { Landmark, MapPin } from 'lucide-react';
import { Source, Layer } from 'react-map-gl/maplibre';
import GISMapContainer from '@/components/maps/GISMapContainer';
import { leafletRingToGeoJSON } from '@/lib/geoUtils';

interface LocationTabProps {
  sub: any;
}

export const LocationTab = ({ sub }: LocationTabProps) => {
  // Memetakan batas luar bidang tanah site plan
  const outerBoundaryGeoJSON = useMemo(() => {
    if (!sub?.location?.polygon || sub.location.polygon.length === 0) return null;
    try {
      const ring = leafletRingToGeoJSON(sub.location.polygon as [number, number][]);
      return {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {}
        }]
      };
    } catch (e) {
      console.warn('[DetailMap] Gagal memetakan polygon batas luar:', e);
      return null;
    }
  }, [sub]);

  // Memetakan detail denah tapak (jalan, RTH, PSU, kaveling)
  const siteplanFeaturesGeoJSON = useMemo(() => {
    const features: any[] = [];
    const loc = sub?.location;
    if (!loc) return { type: 'FeatureCollection' as const, features };

    const addPoly = (rings: [number, number][][], color: string, label: string) => {
      rings.forEach((ring) => {
        try {
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [leafletRingToGeoJSON(ring)] },
            properties: { color, label },
          });
        } catch { /* skip */ }
      });
    };
    if (loc.roadPolygons) addPoly(loc.roadPolygons, '#cbd5e1', 'Jalan');
    if (loc.rthPolygons) addPoly(loc.rthPolygons, '#10b981', 'RTH');
    if (loc.psuPolygons) addPoly(loc.psuPolygons, '#14b8a6', 'PSU');
    if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'Kaveling');

    return { type: 'FeatureCollection' as const, features };
  }, [sub]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-200">
      {/* Kolom Kiri: Detail Textual */}
      <div className="space-y-6 text-left">
        <div>
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <Landmark className="h-4.5 w-4.5 text-primary" />
            Informasi Spasial Lahan & Kepemilikan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Lokasi Proyek</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.locationName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan Terdaftar</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.landArea ? `${sub.locationDetails.landArea.toLocaleString('id-ID')} m²` : (sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Desa / Kelurahan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.village || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kecamatan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.district || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kabupaten / Kota</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.city || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Provinsi</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.province || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat Lengkap Lahan</span>
              <span className="text-xs font-semibold text-slate-600 block">{sub.locationDetails?.fullAddress || sub.location.address}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Sertifikasi & Legalitas Tanah
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Status Kepemilikan</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.ownershipStatus || 'SHM'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor Sertifikat</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.locationDetails?.certificateNumber || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Pemilik Hak Sertifikat</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.certificateOwner || '-'}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Kesesuaian Tata Ruang Otoritas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor SK KKPR BPN / Dinas</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.spatial?.kkprNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Zoning Peruntukan Rencana Tata Ruang</span>
              <span className="text-xs font-bold text-slate-700 block">{sub.spatial?.landUse || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Alokasi PSU & RTH (m²)</span>
              <span className="text-xs font-bold text-slate-700 block">
                {sub.spatial?.greenArea ? `${sub.spatial.greenArea.toLocaleString('id-ID')} m²` : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
            Sistem Koordinat & Transformasi Helmert 2D
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama File CAD Asal</span>
              <span className="text-xs font-mono font-bold text-slate-700 block truncate" title={sub.coordinate?.cadFileName}>{sub.coordinate?.cadFileName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Faktor Skala Spasial (s)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadScale !== undefined ? sub.coordinate.cadScale : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Parameter Helmert A</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamA !== undefined ? sub.coordinate.cadParamA : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Parameter Helmert B</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamB !== undefined ? sub.coordinate.cadParamB : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Translasi X (Tx)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamTx !== undefined ? sub.coordinate.cadParamTx : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Translasi Y (Ty)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadParamTy !== undefined ? sub.coordinate.cadParamTy : '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sudut Rotasi Spasial (Radian)</span>
              <span className="text-xs font-mono font-bold text-slate-700 block">{sub.coordinate?.cadRotation !== undefined ? `${sub.coordinate.cadRotation} rad` : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Visualisasi Peta Proyeksi Spasial */}
      <div className="space-y-4 flex flex-col justify-between text-left">
        <div>
          <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <MapPin className="h-4.5 w-4.5 text-primary" />
            Visualisasi Proyeksi Bidang & Site Plan (SHP/CAD)
          </h3>
          <div className="h-[300px] w-full relative border border-border bg-slate-100 overflow-hidden">
            {sub.location.lat && sub.location.lng ? (
              <GISMapContainer
                center={[sub.location.lat, sub.location.lng]}
                zoom={16}
                className="w-full h-full"
              >
                {/* Render Outer Boundary */}
                {outerBoundaryGeoJSON && (
                  <Source id="outer-boundary" type="geojson" data={outerBoundaryGeoJSON}>
                    <Layer
                      id="outer-boundary-line"
                      type="line"
                      paint={{
                        'line-color': '#ef4444',
                        'line-width': 2.5,
                        'line-dasharray': [2, 2]
                      }}
                    />
                    <Layer
                      id="outer-boundary-fill"
                      type="fill"
                      paint={{
                        'fill-color': '#ef4444',
                        'fill-opacity': 0.08
                      }}
                    />
                  </Source>
                )}

                {/* Render Site Plan AutoCAD Vectors */}
                {siteplanFeaturesGeoJSON.features.length > 0 && (
                  <Source id="siteplan-features" type="geojson" data={siteplanFeaturesGeoJSON}>
                    <Layer
                      id="siteplan-features-fill"
                      type="fill"
                      paint={{
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.65
                      }}
                    />
                    <Layer
                      id="siteplan-features-line"
                      type="line"
                      paint={{
                        'line-color': '#ffffff',
                        'line-width': 1
                      }}
                    />
                  </Source>
                )}
              </GISMapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Peta spasial tidak tersedia untuk koordinat ini.
              </div>
            )}
          </div>
        </div>

        {/* Legenda Layer */}
        <div className="bg-slate-50 border border-border p-3.5 space-y-2 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Legenda Layer Site Plan:</span>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 border border-dashed border-red-500 bg-red-500/10 block shrink-0"></span>
              Batas Lahan (Outer Boundary)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#64748b] block shrink-0"></span>
              Kaveling Unit Hunian
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#cbd5e1] block shrink-0"></span>
              Jaringan Jalan & ROW
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#10b981] block shrink-0"></span>
              RTH (Ruang Terbuka Hijau)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 bg-[#14b8a6] block shrink-0"></span>
              PSU / Sarana Utilitas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
