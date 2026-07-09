import { memo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface PinMarkerProps {
  sub: any;
  isSelected: boolean;
  sizeBase?: number;
  onClickPin: (sub: any) => void;
  onShowPopup: (sub: any) => void;
}

export const PinMarker = memo(function PinMarker({
  sub, isSelected, sizeBase = 28, onClickPin, onShowPopup,
}: PinMarkerProps) {
  const size = isSelected ? sizeBase + 4 : sizeBase;
  const boxShadow = isSelected
    ? `0 0 0 3px ${sub.color},0 4px 16px rgba(0,0,0,0.5)`
    : '0 2px 8px rgba(0,0,0,0.3)';

  const icon = L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${sub.color};
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:${boxShadow};
      cursor:pointer;
      transition:all 0.15s ease;
    "></div>`,
  });

  // Gunakan centroid polygon jika tersedia, fallback ke location.lat/lng
  const lat = sub.centroidLat ?? sub.location.lat;
  const lng = sub.centroidLng ?? sub.location.lng;

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onShowPopup(sub);
          onClickPin(sub);
        },
      }}
    />
  );
});
