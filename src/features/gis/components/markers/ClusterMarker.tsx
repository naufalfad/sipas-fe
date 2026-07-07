import { memo } from 'react';
import { Marker } from 'react-map-gl/maplibre';

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
  return (
    <Marker longitude={lng} latitude={lat} anchor="center"
      onClick={(e) => { e.originalEvent.stopPropagation(); onExpand(clusterId, lng, lat, zoom); }}>
      <div style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
        border: '3px solid #fff', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 44 ? 12 : 14, fontWeight: 900, color: '#fff',
        boxShadow: '0 2px 12px rgba(20,184,166,0.55)', cursor: 'pointer',
      }}>
        {count}
      </div>
    </Marker>
  );
});
