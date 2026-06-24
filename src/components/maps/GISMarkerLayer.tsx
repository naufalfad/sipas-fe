import { Marker, Popup } from 'react-leaflet';
import { customMarkerIcon } from './GISMapContainer';

export interface GISMarkerData {
  id: string;
  position: [number, number];
  housingName: string;
  developerName: string;
  address: string;
}

interface GISMarkerLayerProps {
  data: GISMarkerData[];
}

export default function GISMarkerLayer({ data }: GISMarkerLayerProps) {
  return (
    <>
      {data.map((marker) => (
        <Marker 
          key={marker.id} 
          position={marker.position} 
          icon={customMarkerIcon}
        >
          <Popup>
            <div className="p-1 space-y-1 text-xs">
              <h4 className="font-bold text-slate-800 text-sm leading-tight">{marker.housingName}</h4>
              <p className="text-slate-500 font-medium">{marker.developerName}</p>
              <p className="text-slate-400 leading-relaxed mt-1 max-w-[180px]">{marker.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
