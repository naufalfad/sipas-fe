import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface GISDrawingMapProps {
    onShapeChange: (coordinates: number[][][]) => void;
    initialValue?: number[][][];
}

export default function GISDrawingMap({ onShapeChange, initialValue }: GISDrawingMapProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // 1. Konfigurasi Geoman (Alat Gambar)
        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: false,
            drawText: false,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: true,
        });

        // 2. Set Bahasa (Opsional)
        map.pm.setLang('id');

        // 3. Fungsi untuk mengambil koordinat setiap kali gambar berubah
        const updateCoordinates = () => {
            const layers = map.pm.getGeomanLayers();
            const allCoords = layers.map((layer: any) => {
                const latLngs = layer.getLatLngs();
                // Format Leaflet [[lat, lng]] perlu kita rapikan
                return latLngs[0].map((ll: L.LatLng) => [ll.lat, ll.lng]);
            });

            // Kirim data koordinat ke form utama
            onShapeChange(allCoords);
        };

        // 4. Event Listener: Jalankan fungsi di atas saat selesai gambar/edit/hapus
        map.on('pm:create', (e: any) => {
            updateCoordinates();
            e.layer.on('pm:edit', updateCoordinates);
        });

        map.on('pm:remove', updateCoordinates);

        return () => {
            map.pm.removeControls();
            map.off('pm:create');
            map.off('pm:remove');
        };
    }, [map, onShapeChange]);

    return null; // Komponen ini hanya mengatur logika, tidak merender elemen HTML baru
}