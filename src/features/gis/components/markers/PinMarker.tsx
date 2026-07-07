import { memo } from 'react';
import { Marker } from 'react-map-gl/maplibre';

interface ProcessedSubmission {
  id: string;
  color: string;
  location: {
    lng: number;
    lat: number;
  };
}

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
  return (
    <Marker longitude={sub.location.lng} latitude={sub.location.lat} anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onShowPopup(sub);
        onClickPin(sub);
      }}>
      <div style={{
        width: size, height: size, background: sub.color,
        border: '3px solid #fff',
        borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
        boxShadow: isSelected
          ? `0 0 0 3px ${sub.color}, 0 4px 16px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }} />
    </Marker>
  );
});
