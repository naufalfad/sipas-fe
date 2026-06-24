import React from 'react';
import { MapContainer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in React bundle build
export const customMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GISMapContainerProps {
  center?: [number, number];
  zoom?: number;
  children: React.ReactNode;
}

export default function GISMapContainer({ 
  center = [-6.595189, 106.816629], // Bogor default
  zoom = 13, 
  children 
}: GISMapContainerProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl shadow-inner border border-slate-200 dark:border-slate-700"
    >
      {children}
    </MapContainer>
  );
}
