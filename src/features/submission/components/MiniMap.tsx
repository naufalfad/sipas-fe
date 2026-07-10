import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Perbaikan bug aset ikon penanda bawaan Leaflet pada bundler modern
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MiniMapProps {
  center: [number, number];
  polygon?: [number, number][];
  housingName?: string;
}

function MapResizer({ center, polygon }: { center: [number, number]; polygon?: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // Memaksa kalkulasi ukuran ulang Leaflet container untuk mencegah tile abu-abu
    map.invalidateSize();
    if (polygon && polygon.length > 0) {
      const bounds = L.latLngBounds(polygon);
      map.fitBounds(bounds, { padding: [15, 15] });
    } else {
      map.setView(center, 15);
    }
  }, [map, center, polygon]);
  return null;
}

export const MiniMap = ({ center, polygon, housingName }: MiniMapProps) => {
  return (
    <div className="h-[220px] w-full border border-border relative z-10">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polygon && polygon.length > 0 && (
          <Polygon
            positions={polygon}
            pathOptions={{ color: '#415D43', fillColor: '#A1CCA5', fillOpacity: 0.3, weight: 2 }}
          />
        )}
        <Marker position={center}>
          <Popup>
            <span className="text-xs font-bold text-slate-800 block">{housingName || 'Lokasi Tapak'}</span>
          </Popup>
        </Marker>
        <MapResizer center={center} polygon={polygon} />
      </MapContainer>
    </div>
  );
};
