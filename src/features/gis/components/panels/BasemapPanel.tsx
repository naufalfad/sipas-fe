import React from 'react';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import {
    Map as MapIcon,
    Sun,
    Moon,
    Layers,
    Info,
    Compass
} from 'lucide-react';

interface BaseMapItem {
    id: string;
    label: string;
    desc: string;
    icon: React.ComponentType<any>;
}

export default function BasemapPanel() {
    const { activeBaseMap, setActiveBaseMap } = useGisUIStore();

    // Katalog Peta Dasar (Basemaps) yang Didukung oleh GEOSIPAS
    const baseMaps: BaseMapItem[] = [
        {
            id: 'voyager',
            label: 'CartoDB Voyager (Terang)',
            icon: Compass,
            desc: 'Visualisasi jalan minimalis berwarna terang untuk verifikasi administrasi siang hari'
        },
        {
            id: 'street',
            label: 'Google Roadmap',
            icon: MapIcon,
            desc: 'Menyajikan jaringan jalan, nama batas wilayah adm, dan fasilitas umum terdekat'
        },
        {
            id: 'osm',
            label: 'OpenStreetMap (Standard)',
            icon: Layers,
            desc: 'Peta jalan komunitas global dengan batas administrasi dasar yang ringan'
        },
        {
            id: 'satellite',
            label: 'Google Satellite / Esri',
            icon: Sun,
            desc: 'Citra satelit resolusi tinggi untuk memverifikasi kondisi vegetasi & bangunan riil'
        },
        {
            id: 'dark',
            label: 'CartoDB Dark Matter',
            icon: Moon,
            desc: 'Visualisasi kontras tinggi dengan latar belakang gelap untuk overlay zonasi'
        },
    ];

    const handleSelectBasemap = (id: string) => {
        try {
            setActiveBaseMap(id);
        } catch (error) {
            console.error('Gagal mengganti basemap spasial:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans select-none text-left">

            {/* Banner Rekomendasi Spasial */}
            <div className="px-5 py-4 bg-teal-50/40 border-b border-slate-200 flex items-start gap-3">
                <Info size={14} className="text-teal-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold uppercase tracking-wide">
                    Pilih peta dasar yang sesuai dengan jenis analisis Anda.
                    <strong className="text-slate-800 font-black"> CartoDB Dark</strong> sangat disarankan saat Anda menguji kesesuaian tumpang-tindih (overlay) poligon site plan.
                </p>
            </div>

            {/* Daftar Peta Dasar (Flush List) */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-slate-500">
                    <Layers size={13} className="text-teal-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Katalog Peta Dasar</h4>
                </div>

                <div className="flex flex-col divide-y divide-slate-100">
                    {baseMaps.map((map) => {
                        const isActive = activeBaseMap === map.id;

                        return (
                            <button
                                key={map.id}
                                type="button"
                                onClick={() => handleSelectBasemap(map.id)}
                                className="group flex items-center justify-between px-5 py-3.5 bg-white hover:bg-slate-50 transition-all text-left w-full outline-none rounded-none border-none cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Custom Taktis Toggle Switch GFW Style */}
                                    <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-teal-600' : 'bg-slate-200'
                                        }`}>
                                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                                            }`} />
                                    </div>

                                    {/* Detil Info Teks */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`shrink-0 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                                            }`}>
                                            <map.icon size={16} strokeWidth={2.5} />
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-xs tracking-tight transition-colors leading-none ${isActive ? 'text-teal-700 font-bold' : 'text-slate-700 font-semibold group-hover:text-slate-900'
                                                }`}>
                                                {map.label}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 leading-tight mt-1 max-w-[200px] truncate">
                                                {map.desc}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}