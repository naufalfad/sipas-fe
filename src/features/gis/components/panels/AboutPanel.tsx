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
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 pb-12 select-none text-left font-sans text-slate-700 dark:text-slate-300">

            {/* Header Konsol Informasi Hukum */}
            <div className="text-center py-6 bg-slate-900 text-white rounded-none shrink-0 border-b border-slate-950">
                <ShieldCheck size={28} className="mx-auto text-teal-400 animate-pulse" />
                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.25em] mt-3.5 leading-none">
                    GEOSIPAS BOGOR
                </h4>
                <p className="text-[8px] text-teal-400 font-bold uppercase tracking-widest mt-2 leading-none">
                    Sistem Verifikasi Rencana Tapak Digital v1.0
                </p>
            </div>

            {/* Konten Utama (High-Density) */}
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">

                {/* Ringkasan Visi */}
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed text-justify">
                    GEOSIPAS beroperasi sebagai platform integrasi geospasial satu pintu untuk mengotomatisasi penilaian kesesuaian tata ruang, pemetaan batas bidang tanah BPN, serta kalkulasi koefisien dasar bangunan di Kabupaten Bogor [Slide 3, Slide 6].
                </p>

                {/* Seksi 1: Landasan Hukum Riil */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-1.5 border-b pb-1.5 leading-none">
                        <Scale size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                        1. Landasan Hukum & Regulasi
                    </h3>

                    <div className="border-l-2 border-teal-600 dark:border-teal-500 pl-3.5 py-1 space-y-1.5 text-left">
                        <div className="flex items-center justify-between gap-4 leading-none">
                            <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                Peraturan Bupati Bogor
                            </h4>
                            <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 border-none rounded-none text-[8px] font-black px-1.5 py-0.5 leading-none shadow-none">
                                No. 4 Tahun 2025
                            </Badge>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Tentang <strong className="font-bold text-slate-700 dark:text-slate-350">Pedoman Pengesahan Master Plan, Site Plan, dan Gambar Situasi</strong>. Regulasi ini resmi mencabut Perbup Bogor No. 114 Tahun 2021 untuk mendigitalisasi total pengawasan perizinan ruang.
                        </p>
                    </div>
                </div>

                {/* Seksi 2: Integrasi Ekosistem Data Spasial */}
                <div className="space-y-4 pt-1">
                    <h3 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-1.5 border-b pb-1.5 leading-none">
                        <Globe size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                        2. Integrasi Data Nasional & Daerah
                    </h3>

                    <div className="space-y-4">
                        {/* Integrasi Nasional */}
                        <div className="border-l-2 border-slate-400 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Database size={11} className="text-slate-400 shrink-0" />
                                Integrasi Nasional
                            </h4>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Terkoneksi langsung ke layanan **OSS RBA** (NIB), **SIMBG** (sinkronisasi tata letak bangunan), **ATR/BPN** (validasi batas bidang tanah), **Sertifikat Digital BSrE** (TTE SK resmi), dan **Satu Data Indonesia** [Slide 10].
                            </p>
                        </div>

                        {/* Integrasi Daerah */}
                        <div className="border-l-2 border-slate-400 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Building size={11} className="text-slate-400 shrink-0" />
                                Integrasi Daerah
                            </h4>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Menyinkronkan data spasial ke **SIMTARU** (RTRW & RDTR), **SIPD** (perencanaan pembangunan), **E-Office** (persuratan dinas), **Command Center Eksekutif**, dan **Sistem Pajak Daerah** (BPHTB/PBB) [Slide 10].
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seksi 3: Standar Batas Maksimal (Matriks Teknis) */}
                <div className="space-y-4 pt-1">
                    <h3 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-1.5 border-b pb-1.5 leading-none">
                        <Cpu size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                        3. Algoritma Validasi Spasial (Rule Engine)
                    </h3>

                    <div className="space-y-2">
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Setiap pengajuan CAD/SHP diuji otomatis oleh *rule engine* spasial untuk mencocokkan standar koefisien bangunan daerah [Slide 6]:
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px] font-black text-slate-700 dark:text-slate-300 select-none">
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 border border-slate-150 dark:border-slate-700 rounded-none text-left">KDB: Max 60%</div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 border border-slate-150 dark:border-slate-700 rounded-none text-left">KLB: Max 3.5</div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 border border-slate-150 dark:border-slate-700 rounded-none text-left">KDH: Min 10%</div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 border border-slate-150 dark:border-slate-700 rounded-none text-left">RTH: Min 1400m²</div>
                        </div>
                    </div>
                </div>

                {/* Banner Hak Cipta & Disclaimer */}
                <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-none flex items-start gap-2.5 text-left text-teal-950 dark:text-teal-200">
                    <HelpCircle className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none">Hak Akses & Otoritas</h5>
                        <p className="text-[9px] font-semibold leading-normal text-teal-700 dark:text-teal-400 text-left">
                            Sistem ini berada di bawah kendali penuh Pemerintah Kabupaten Bogor. Seluruh aktivitas audit spasial dan verifikasi gambar CAD terekam secara aman dalam riwayat tracking digital (*Audit Trail*).
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}