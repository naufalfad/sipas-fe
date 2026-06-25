import { useMemo } from 'react';
import { Layers, ClipboardList, Map as MapIcon, Info } from 'lucide-react';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import type { GisPanelType } from '@/app/store/useGisUIStore';

interface NavigationItem {
    type: GisPanelType;
    label: string;
    icon: React.ComponentType<any>;
    title: string;
}

export default function GisSidebar() {
    const { openPanel, activePanels, closePanelsToTheRight } = useGisUIStore();

    // 1. Konfigurasi Navigasi Taktis (Rata Kiri, Siku Kaku)
    const navigationItems = useMemo<NavigationItem[]>(() => [
        {
            type: 'layer-kewajiban',
            label: 'Layers',
            icon: Layers,
            title: 'Konfigurasi Layer Regulasi',
        },
        {
            type: 'basemap-gallery',
            label: 'Basemap',
            icon: MapIcon,
            title: 'Katalog Peta Dasar',
        },
        {
            type: 'katalog-perusahaan',
            label: 'Pengajuan',
            icon: ClipboardList,
            title: 'Daftar Pengajuan Site Plan',
        },
    ], []);

    const isPanelActive = (type: GisPanelType) => {
        return activePanels.some((p) => p.type === type);
    };

    const handleNavClick = (item: NavigationItem) => {
        if (isPanelActive(item.type)) {
            closePanelsToTheRight(-1);
        } else {
            closePanelsToTheRight(-1);
            openPanel(item.type, item.title);
        }
    };

    return (
        <aside className="absolute bottom-0 md:top-16 md:bottom-0 left-0 right-0 md:right-auto w-full md:w-16 h-16 md:h-auto flex flex-row md:flex-col items-center justify-between md:justify-start bg-white border-t md:border-t-0 md:border-r border-slate-200 z-[150] md:z-40 pointer-events-auto overflow-x-auto md:overflow-visible">
            {/* Menu Atas */}
            <div className="flex-1 flex flex-row md:flex-col items-center w-max md:w-full h-full md:h-auto">
                {navigationItems.map((item, index) => {
                    const isActive = isPanelActive(item.type);

                    return (
                        <div key={index} className="relative group h-full md:h-auto w-16 md:w-full flex justify-center shrink-0">
                            <button
                                type="button"
                                onClick={() => handleNavClick(item)}
                                className={`w-full h-full md:h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none border-t-[3px] md:border-t-0 md:border-l-[3px]
                  ${isActive
                                        ? 'bg-teal-50 text-teal-600 border-teal-500'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.label}
                                </span>
                            </button>

                            {/* Tooltip Hover Deskripsi */}
                            <div className="hidden md:block absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-slate-700">
                                {item.title}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 rounded-none border-b border-l border-slate-700" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Menu Bawah (Tentang Sistem) */}
            <div className="flex flex-row md:flex-col items-center justify-between h-full md:h-auto w-auto md:w-full md:mt-auto shrink-0 pr-2 md:pr-0">
                <div className="h-8 md:w-8 w-px md:h-px bg-slate-200 mx-2 md:mx-0 md:mb-1" />

                <div className="relative group h-full md:h-auto w-16 md:w-full flex justify-center shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (isPanelActive('tentang')) {
                                closePanelsToTheRight(-1);
                            } else {
                                closePanelsToTheRight(-1);
                                openPanel('tentang', 'Tentang GEOSIPAS');
                            }
                        }}
                        className={`w-full h-full md:h-16 flex items-center justify-center transition-colors relative active:bg-slate-100 rounded-none outline-none border-t-[3px] md:border-t-0 md:border-l-[3px] 
              ${isPanelActive('tentang')
                                ? 'bg-teal-50 text-teal-600 border-teal-500'
                                : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                    >
                        <Info size={20} strokeWidth={isPanelActive('tentang') ? 2.5 : 2} />
                    </button>

                    <div className="hidden md:block absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-slate-700">
                        Tentang Sistem
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 rounded-none border-b border-l border-slate-700" />
                    </div>
                </div>
            </div>
        </aside>
    );
}