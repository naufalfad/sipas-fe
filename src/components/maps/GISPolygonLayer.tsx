import { Polygon, Popup } from 'react-leaflet';

export interface GISPolygonData {
  id: string;
  positions: [number, number][];
  housingName: string;
  developerName: string;
  landArea: number;
  status: string;
  color?: string;
}

interface GISPolygonLayerProps {
  data: GISPolygonData[];
}

export default function GISPolygonLayer({ data }: GISPolygonLayerProps) {
  return (
    <>
      {data.map((polygon) => (
        <Polygon
          key={polygon.id}
          positions={polygon.positions}
          pathOptions={{
            color: polygon.color || '#0d9488', // Default teal
            fillColor: polygon.color || '#0d9488',
            fillOpacity: 0.25,
            weight: 3,
          }}
        >
          <Popup>
            <div className="p-1 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 text-sm leading-tight">{polygon.housingName}</h4>
              <p className="text-slate-500 font-medium">{polygon.developerName}</p>
              <div className="pt-1.5 border-t border-slate-100 flex justify-between gap-4">
                <span>Luas Lahan:</span>
                <span className="font-semibold text-slate-700">{polygon.landArea.toLocaleString('id-ID')} m²</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Status:</span>
                <span className="font-bold text-teal-600">{polygon.status}</span>
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
}
