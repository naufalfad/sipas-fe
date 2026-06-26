import {
    ShieldCheck,
    Scale,
    Cpu,
    Globe,
    Database,
    Building,
    HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AboutPanel() {
    return (
        <div className="flex flex-col h-full bg-white pb-12 select-none text-left font-sans text-slate-700">

            {/* ─── SEKSI 1: HEADER PANEL (FLUSH EDGE-TO-EDGE) ─── */}
            <div className="px-4 py-5 bg-white shrink-0 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 bg-[#e8f2ea] border border-[#A1CCA5]/60 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-primary" />
                </div>
                <div className="text-left">
                    <h4 className="text-[10px] font-bold text-[#111D13] uppercase tracking-[0.2em] leading-none">
                        GEOSIPAS BOGOR
                    </h4>
                    <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-1.5 leading-none">
                        Sistem Verifikasi Rencana Tapak Digital v1.0
                    </p>
                </div>
            </div>

            {/* ─── SEKSI 2: AREA SCROLL KONTEN UTAMA (FLUSH DIVIDERS) ─── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white divide-y divide-border/60">

                {/* Ringkasan Visi */}
                <p className="px-4 py-5 text-[11px] font-semibold text-slate-500 leading-relaxed text-justify">
                    GEOSIPAS beroperasi sebagai platform integrasi geospasial satu pintu untuk mengotomatisasi penilaian kesesuaian tata ruang, pemetaan batas bidang tanah BPN, serta kalkulasi koefisien dasar bangunan di Kabupaten Bogor [Slide 3, Slide 6].
                </p>

                {/* Seksi 1: Landasan Hukum Riil (No Left Border, No Card Outlines) */}
                <div className="px-4 py-5 space-y-3.5">
                    <h3 className="text-[10px] font-bold uppercase text-[#111D13] tracking-widest flex items-center gap-1.5 leading-none">
                        <Scale size={13} className="text-primary shrink-0" />
                        1. Landasan Hukum & Regulasi
                    </h3>

                    <div className="space-y-2.5 text-left">
                        <div className="flex items-center justify-between gap-4 leading-none">
                            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                                Peraturan Bupati Bogor
                            </h4>
                            <Badge className="bg-[#e8f2ea] text-primary border-[#A1CCA5]/60 rounded-none text-[8px] font-bold px-1.5 py-0.5 leading-none shadow-none">
                                No. 4 Tahun 2025
                            </Badge>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">
                            Tentang <strong className="font-bold text-slate-700">Pedoman Pengesahan Master Plan, Site Plan, dan Gambar Situasi</strong>. Regulasi ini resmi mencabut Perbup Bogor No. 114 Tahun 2021 untuk mendigitalisasi total pengawasan perizinan ruang.
                        </p>
                    </div>
                </div>

                {/* Seksi 2: Integrasi Ekosistem Data Spasial (Clean Flat Text Blocks) */}
                <div className="px-4 py-5 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-[#111D13] tracking-widest flex items-center gap-1.5 leading-none">
                        <Globe size={13} className="text-primary shrink-0" />
                        2. Integrasi Data Nasional & Daerah
                    </h3>

                    <div className="space-y-4">
                        {/* Integrasi Nasional */}
                        <div className="space-y-1.5 text-left">
                            <h4 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Database size={11} className="text-[#709775] shrink-0" />
                                Integrasi Nasional
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed">
                                Terkoneksi langsung ke layanan OSS RBA (NIB), SIMBG (sinkronisasi tata letak bangunan), ATR/BPN (validasi batas bidang tanah), Sertifikat Digital BSrE (TTE SK resmi), dan Satu Data Indonesia.
                            </p>
                        </div>

                        {/* Integrasi Daerah */}
                        <div className="space-y-1.5 text-left">
                            <h4 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Building size={11} className="text-[#709775] shrink-0" />
                                Integrasi Daerah
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed">
                                Menyinkronkan data spasial ke SIMTARU (RTRW & RDTR), SIPD (perencanaan pembangunan), E-Office (persuratan dinas), Command Center Eksekutif, dan Sistem Pajak Daerah (BPHTB/PBB).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seksi 3: Standar Batas Maksimal (Grid with outlines removed and bottom slate lines) */}
                <div className="px-4 py-5 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-[#111D13] tracking-widest flex items-center gap-1.5 leading-none">
                        <Cpu size={13} className="text-primary shrink-0" />
                        3. Algoritma Validasi Spasial (Rule Engine)
                    </h3>

                    <div className="space-y-3.5">
                        <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                            Setiap pengajuan CAD/SHP diuji otomatis oleh rule engine spasial untuk mencocokkan standar koefisien bangunan daerah:
                        </p>

                        {/* Grid dengan pembatas tipis bawah saja (Tanpa kotak luar) */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 font-sans text-xs text-[#111D13] select-none py-1.5">
                            <div className="flex justify-between items-center border-b border-border/60 pb-2">
                                <span className="text-slate-400 font-medium">KDB</span>
                                <span className="font-bold text-slate-800">Max 60%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/60 pb-2">
                                <span className="text-slate-400 font-medium">KLB</span>
                                <span className="font-bold text-slate-800">Max 3.5</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/60 pb-2">
                                <span className="text-slate-400 font-medium">KDH</span>
                                <span className="font-bold text-slate-800">Min 10%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/60 pb-2">
                                <span className="text-slate-400 font-medium">RTH</span>
                                <span className="font-bold text-slate-800">Min 1400m²</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner Hak Cipta & Disclaimer (Flush Edge-to-Edge) */}
                <div className="px-4 py-5 bg-[#e8f2ea]/40 flex items-start gap-2.5 text-left text-[#111D13]">
                    <HelpCircle className="text-primary shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-bold uppercase tracking-widest leading-none text-primary">Hak Akses & Otoritas</h5>
                        <p className="text-[9px] font-semibold leading-normal text-slate-500 text-left">
                            Sistem ini berada di bawah kendali penuh Pemerintah Kabupaten Bogor. Seluruh aktivitas audit spasial dan verifikasi gambar CAD terekam secara aman dalam riwayat tracking digital (*Audit Trail*).
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}