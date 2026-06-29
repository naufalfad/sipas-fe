import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import type { GisPanelType } from '@/app/store/useGisUIStore';
import { motion, AnimatePresence } from 'framer-motion';

import LayerPanel from './panels/LayerPanel';
import BasemapPanel from './panels/BasemapPanel';
import SubmissionListPanel from './panels/SubmissionListPanel';
import DetailSubmissionPanel from './panels/DetailSubmissionPanel';
import SpatialCheckPanel from './panels/SpatialCheckPanel';
import AboutPanel from './panels/AboutPanel';
import CompensationPanel from './panels/CompensationPanel';

// Mapper untuk melabeli kategori laci di bagian atas header panel (Sentence Case, text-sm)
const getPanelCategoryLabel = (type: GisPanelType): string => {
    const labels: Record<GisPanelType, string> = {
        'layer-kewajiban': 'Konfigurasi layer',
        'basemap-gallery': 'Katalog peta dasar',
        'katalog-perusahaan': 'Daftar pengajuan',
        'detil-perusahaan': 'Detail proyek',
        'telemetri-lingkungan': 'Hasil analisis spasial',
        'tugas-patroli': 'Tugas sidak',
        'detail-tugas': 'Detail sidak',
        'armada-tracking': 'Pelacakan armada',
        'hasil-pencarian': 'Hasil pencarian',
        'tentang': 'Tentang sistem',
        'ai-copilot': 'AI Asisten Spasial',
        'sensor-management': 'Manajemen sensor',
        'compensation-manager': 'Manajemen Kompensasi',
        'conflict-inspector': 'Inspeksi Konflik Lapangan',
    };
    return labels[type] || type.replace('-', ' ');
};

export default function PanelOrchestrator() {
    const { activePanels, closePanel, closePanelsToTheRight } = useGisUIStore();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. DYNAMIC WIDTH ALGORITHM: Mengatur lebar laci secara konsisten berdasarkan tipe
    const getPanelWidth = (type: GisPanelType): number => {
        if (isMobile) return window.innerWidth - 64;
        // Laci analisis detail diperlebar ke 360px untuk kelegaan pembacaan peta data
        if (type === 'telemetri-lingkungan' || type === 'detil-perusahaan') {
            return 360;
        }
        return 280; // Lebar standar menu navigasi kiri
    };

    // Delegasi Rendering Konten Spasial secara Modular (High Cohesion)
    const renderPanelContent = (type: GisPanelType, payload?: any) => {
        switch (type) {
            case 'layer-kewajiban':
                return <LayerPanel />;
            case 'basemap-gallery':
                return <BasemapPanel />;
            case 'katalog-perusahaan':
                return <SubmissionListPanel />;
            case 'detil-perusahaan':
                return <DetailSubmissionPanel submissionData={payload} />;
            case 'telemetri-lingkungan':
                return <SpatialCheckPanel submissionData={payload} />;
            case 'compensation-manager':
                return <CompensationPanel />;
            case 'tentang':
                return <AboutPanel />;
            default:
                return (
                    <div className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">
                        Modul sedang dikonstruksi...
                    </div>
                );
        }
    };

    return (
        <div className="absolute top-16 md:bottom-0 bottom-16 left-0 md:left-16 right-0 md:right-auto z-[100] md:z-30 pointer-events-none md:pointer-events-auto flex items-start">
            <AnimatePresence>
                {activePanels.map((panel, index) => {
                    // Menentukan apakah laci bersifat melayang (floating) di atas peta
                    const isFloating =
                        panel.type === 'detil-perusahaan' ||
                        panel.type === 'telemetri-lingkungan' ||
                        panel.type === 'detail-tugas';

                    const currentWidth = getPanelWidth(panel.type);

                    // 2. MATHEMATICAL DYNAMIC OFFSET CALCULATION (Zero-Gap Stack Policy)
                    let dockedOffset = 0;
                    for (let i = 0; i < index; i++) {
                        const p = activePanels[i];
                        const pIsFloating = p.type === 'detil-perusahaan' || p.type === 'telemetri-lingkungan' || p.type === 'detail-tugas';
                        if (!pIsFloating) {
                            dockedOffset += getPanelWidth(p.type);
                        }
                    }

                    let floatingLeft = 16;
                    if (!isMobile) {
                        let totalDockedWidth = 0;
                        activePanels.forEach((p) => {
                            const pIsFloating = p.type === 'detil-perusahaan' || p.type === 'telemetri-lingkungan' || p.type === 'detail-tugas';
                            if (!pIsFloating) {
                                totalDockedWidth += getPanelWidth(p.type);
                            }
                        });

                        let totalFloatingBefore = 0;
                        for (let i = 0; i < index; i++) {
                            const p = activePanels[i];
                            const pIsFloating = p.type === 'detil-perusahaan' || p.type === 'telemetri-lingkungan' || p.type === 'detail-tugas';
                            if (pIsFloating) {
                                totalFloatingBefore += getPanelWidth(p.type) + 16; // Gap 16px antar laci melayang
                            }
                        }

                        floatingLeft = totalDockedWidth + totalFloatingBefore + 16;
                    }

                    return (
                        <motion.div
                            key={panel.id}
                            initial={isMobile ? { y: '100%' } : { opacity: 0, x: -20 }}
                            animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
                            exit={isMobile ? { y: '100%' } : { opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`absolute pointer-events-auto bg-white overflow-hidden flex flex-col ${isFloating
                                ? 'md:shadow-2xl md:border border-slate-200 md:rounded-none'
                                : 'md:border-r border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-none rounded-t-3xl md:rounded-none'
                                }`}
                            style={
                                isFloating
                                    ? {
                                        left: isMobile ? 0 : `${floatingLeft}px`,
                                        top: isMobile ? '10vh' : '16px',
                                        bottom: isMobile ? 0 : '16px',
                                        width: isMobile ? '100%' : `${currentWidth}px`,
                                        maxWidth: isMobile ? '100%' : 'calc(100vw - 80px)',
                                        zIndex: isMobile ? 100 + index : 50,
                                    }
                                    : {
                                        left: 0,
                                        top: isMobile ? '25vh' : 0,
                                        bottom: 0,
                                        width: isMobile ? '100%' : `${currentWidth}px`,
                                        transform: isMobile ? 'none' : `translateX(${dockedOffset}px)`,
                                        zIndex: isMobile ? 100 + index : 40 - index,
                                    }
                            }
                        >
                            {/* Handle seret untuk versi Mobile */}
                            {isMobile && (
                                <div
                                    className="w-full flex justify-center py-2 bg-white shrink-0 cursor-pointer active:bg-slate-50 transition-colors group"
                                    onClick={() => closePanel(panel.id)}
                                >
                                    <div className="w-12 h-1.5 bg-slate-200 group-hover:bg-slate-300 transition-colors rounded-full" />
                                </div>
                            )}

                            {/* HEADER PANEL */}
                            <div className="px-4 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 select-none text-left">
                                <div className="flex flex-col">
                                    {/* Label Kategori Atas: text-sm, warna emerald, tidak capslock, tidak tebal */}
                                    <span className="text-sm font-normal text-teal-600 leading-none">
                                        {getPanelCategoryLabel(panel.type)}
                                    </span>
                                    {/* Judul Laci Bawah */}
                                    <h3 className="text-xs font-normal text-slate-800 truncate max-w-[280px] tracking-tight mt-1.5 leading-none">
                                        {panel.title}
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => closePanel(panel.id)}
                                    className="p-1 rounded-none bg-transparent hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition-colors active:scale-95 outline-none"
                                    title="Tutup Panel"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* BODY PANEL CONTENT */}
                            <div
                                className="flex-1 overflow-y-auto custom-scrollbar"
                                onClick={() => !isFloating && closePanelsToTheRight(index)}
                            >
                                {renderPanelContent(panel.type, panel.payload)}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}