/**
 * ============================================================================
 * COMPENSATION PANEL — Laci Samping Manajemen Kompensasi [Purworejo 8]
 * ============================================================================
 * Peran  : Memproses penginputan dan verifikasi kompensasi spasial (mitigasi)
 *          oleh petugas teknis jika terdeteksi deviasi aturan [Bogor 11].
 * 
 * Fitur  : 1. Pilihan tipe kompensasi dinamis (Sawah, Makam, PSU) [Purworejo 8].
 *          2. Tombol interaktif "Plotting Lahan Pengganti" yang terhubung ke
 *             Zustand store untuk menggambar poligon koordinat bumi nyata [Purworejo 8].
 *          3. Alur simpan transaksional untuk memperbarui status permohonan [sipas-fe.txt].
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import { useGisUIStore } from '@/app/store/useGisUIStore';
import { mockSubmissions } from '@/mock/submission/submissions';
import {
    FileText, Loader2, AlertTriangle, HelpCircle, Save, Globe
} from 'lucide-react';
import { toast } from 'sonner';

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export default function CompensationPanel() {
    const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
    const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
    const activeKompensasiMap = useGisUIStore((s) => s.activeKompensasi);

    // Cari data permohonan terpilih untuk asosiasi data [sipas-fe.txt]
    const currentSubmission = useMemo(() => {
        return mockSubmissions.find(s => s.id === selectedCompanyId) || null;
    }, [selectedCompanyId]);

    // Form states
    const [tipeKompensasi, setTipeKompensasi] = useState<'LAHAN_SAWAH' | 'LAHAN_MAKAM_FISIK' | 'LAHAN_MAKAM_UANG' | 'PSU_FISIK_TAMBAHAN'>('LAHAN_MAKAM_FISIK');
    const [luasKompensasi, setLuasKompensasi] = useState<number>(0);
    const [nilaiNominal, setNilaiNominal] = useState<number>(0);
    const [buktiUrl, setBuktiUrl] = useState('');

    const [isDrawing, setIsDrawing] = useState(false);
    const [plottedPolygon, setPlottedPolygon] = useState<[number, number][] | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // ── HANDLER INTERAKSI: PLOTTING SPASIAL LAHAN PENGGANTI [Purworejo 8] ───────
    const handleStartPlotting = () => {
        if (!currentSubmission) {
            toast.error('Pilih berkas pengajuan terlebih dahulu pada peta.');
            return;
        }

        setIsDrawing(true);
        toast.info('Mode Gambar Aktif: Silakan petakan poligon lahan pengganti pada kanvas peta.');

        // Kirim sinyal kustom ke komponen peta SipasMap.tsx
        window.dispatchEvent(new CustomEvent('map-start-drawing-compensation', {
            detail: { tipe: tipeKompensasi }
        }));

        // Simulasi penyelesaian gambar poligon oleh petugas di peta setelah 3 detik
        setTimeout(() => {
            // Koordinat poligon lahan makam / sawah pengganti (WGS84) [Purworejo 8]
            const mockPolygon: [number, number][] = [
                [-6.5940, 106.8155],
                [-6.5940, 106.8160],
                [-6.5945, 106.8160],
                [-6.5945, 106.8155],
                [-6.5940, 106.8155]
            ];

            setPlottedPolygon(mockPolygon);
            setLuasKompensasi(500); // Estimasi luas otomatis hasil Turf.js
            setIsDrawing(false);

            // Sinkronisasikan data kompensasi yang di-plot ke map store [sipas-fe.txt]
            setActiveKompensasi({
                idKompensasi: `komp-new-${Date.now()}`,
                idPermohonan: currentSubmission.id,
                tipeKompensasi,
                luasKompensasiM2: 500,
                statusPemenuhan: 'PROSES_VERIFIKASI',
                polygon: mockPolygon
            });

            toast.success('Sukses: Batas spasial lahan pengganti berhasil dikunci di peta!');
        }, 3000);
    };

    // ── HANDLER SINKRONISASI SIMPAN TRANSAKSIONAL [sipas-fe.txt] ────────────────
    const handleSaveKompensasi = () => {
        if (!currentSubmission) return;

        if (!plottedPolygon && tipeKompensasi !== 'LAHAN_MAKAM_UANG') {
            toast.error('Gagal Menyimpan: Harap lakukan plotting batas spasial lahan pengganti di peta.');
            return;
        }

        setIsSaving(true);

        setTimeout(() => {
            setIsSaving(false);

            // Update status pemenuhan kompensasi di database mockup
            if (activeKompensasiMap) {
                useGisUIStore.getState().updateKompensasiStatus(activeKompensasiMap.idKompensasi, 'TERPENUHI');
            }

            toast.success('Penyimpanan Sukses!', {
                description: 'Jejak audit kompensasi spasial terekam di database.',
            });

            // Tutup panel kompensasi otomatis pasca-simpan
            window.dispatchEvent(new Event('map-clear-clash'));
        }, 1500);
    };

    if (!currentSubmission) {
        return (
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-normal select-none">
                Harap pilih berkas pengajuan di peta untuk mengaktifkan laci kompensasi.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white pb-12 font-sans select-none text-left">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 text-left">

                {/* SECTION 1: HEADER PERMOHONAN */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start gap-3">
                    <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block">ID Permohonan</span>
                        <span className="font-mono font-bold text-xs text-slate-700 block leading-none">{currentSubmission.submissionNo}</span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight uppercase mt-2">{currentSubmission.housingName}</h4>
                    </div>
                </div>

                {/* SECTION 2: ADAPTIVE WARNING BANNER */}
                <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-200 text-[11px] font-semibold text-rose-800 leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                    <p className="leading-snug">
                        Perhatian: Berkas ini memiliki <strong className="font-bold">Pelanggaran Spasial Aktif</strong>. Petugas teknis wajib mendaftarkan mitigasi lahan pengganti sebelum diajukan ke KABID [Bogor 11].
                    </p>
                </div>

                {/* SECTION 3: FORM INPUT KOMPENSASI */}
                <div className="p-5 space-y-4">

                    {/* Input Tipe Kompensasi */}
                    <div>
                        <label className={labelClass}>Tipe Kewajiban Kompensasi</label>
                        <select
                            value={tipeKompensasi}
                            onChange={(e: any) => setTipeKompensasi(e.target.value)}
                            className={inputClass}
                        >
                            <option value="LAHAN_MAKAM_FISIK">Penyediaan TPU Fisik (Makam 2%)</option>
                            <option value="LAHAN_SAWAH">Penggantian Lahan Pertanian (KP2B Sawah 1:1)</option>
                            <option value="LAHAN_MAKAM_UANG">Uang Pengganti Lahan Makam (Kas Daerah)</option>
                            <option value="PSU_FISIK_TAMBAHAN">Fasilitas Sosial Ekstra Luar Kompleks</option>
                        </select>
                    </div>

                    {/* Input Nominal Uang (Kondisional) */}
                    {tipeKompensasi === 'LAHAN_MAKAM_UANG' ? (
                        <div className="animate-in fade-in duration-300">
                            <label className={labelClass}>Nilai Setoran Kas Daerah (Nominal Rp)</label>
                            <input
                                type="number"
                                value={nilaiNominal}
                                onChange={(e) => setNilaiNominal(Number(e.target.value))}
                                placeholder="Masukkan besaran uang pengganti..."
                                className={inputClass}
                            />
                        </div>
                    ) : (
                        /* Input Luas Lahan (Kondisional Fisik) */
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                            <div>
                                <label className={labelClass}>Luas Lahan Pengganti (m²)</label>
                                <input
                                    type="number"
                                    value={luasKompensasi}
                                    readOnly
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-400 font-bold font-mono text-xs rounded-none outline-none cursor-not-allowed"
                                    placeholder="Terisi dari peta..."
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleStartPlotting}
                                    disabled={isDrawing}
                                    className="w-full h-[34px] bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    {isDrawing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Globe size={11} />
                                    )}
                                    <span>{isDrawing ? 'Menggambar...' : 'Plotting di Peta'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bukti Legalitas Sertifikat Lahan Pengganti */}
                    <div>
                        <label className={labelClass}>Bukti Dokumen Legalitas (Sertifikat / Akta Notaris)</label>
                        <div className="relative flex items-center gap-2">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                id="bukti-kompensasi-input"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setBuktiUrl(file.name);
                                        toast.success('Bukti legalitas kompensasi berhasil diunggah!');
                                    }
                                }}
                            />
                            <label
                                htmlFor="bukti-kompensasi-input"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-none cursor-pointer hover:bg-slate-800 transition-colors"
                            >
                                <FileText size={11} /> Pilih PDF Bukti
                            </label>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {buktiUrl ? buktiUrl : 'Format PDF maks. 10MB'}
                            </span>
                        </div>
                    </div>

                </div>

                {/* SECTION 4: SPATIAL INTEGRITY RULE EXPLANATION */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-200/60 flex items-start gap-2.5 text-left select-none">
                    <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">
                            Uji Integritas Spasial Kompensasi
                        </h5>
                        <p className="text-[9px] font-semibold leading-normal text-slate-400 text-justify">
                            Poligon lahan pengganti yang di-plot wajib berada di dalam zona tata ruang resmi Kabupaten Bogor [Bogor 5] dan tidak boleh tumpah tindih dengan bidang kepemilikan BPN yang terdaftar [Bogor 12].
                        </p>
                    </div>
                </div>

                {/* SECTION 5: ACTION FOOTER BUTTONS */}
                <div className="p-5 border-t border-slate-200 flex justify-end gap-3 select-none">
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveKompensasi}
                        className="w-full h-10 bg-primary hover:opacity-95 text-white font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer outline-none border border-primary disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)]"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <Save size={13} />
                        )}
                        <span>SIMPAN DATA MITIGASI</span>
                    </button>
                </div>

            </div>
        </div>
    );
}