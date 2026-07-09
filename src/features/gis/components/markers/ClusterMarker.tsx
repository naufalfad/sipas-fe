import { memo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface ClusterMarkerProps {
  lng: number;
  lat: number;
  count: number;
  clusterId: number;
  zoom: number;
  onExpand: (clusterId: number, lng: number, lat: number, zoom: number) => void;
}

export const ClusterMarker = memo(function ClusterMarker({
  lng, lat, count, clusterId, zoom, onExpand,
}: ClusterMarkerProps) {
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  const fontSize = size < 44 ? 12 : 14;

  const icon = L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:linear-gradient(135deg,#0f766e,#14b8a6);
      border:3px solid #fff;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;font-weight:900;color:#fff;
      box-shadow:0 2px 12px rgba(20,184,166,0.55);cursor:pointer;
      font-family:sans-serif;
    ">${count}</div>`,
  });

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => onExpand(clusterId, lng, lat, zoom),
      }}
    />
  );
});
