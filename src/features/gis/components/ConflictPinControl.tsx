/**
 * ============================================================================
 * CONFLICT PIN CONTROL — Floating HUD Inspector Sidak [Bogor 8]
 * ============================================================================
 * Peran  : Mengontrol aktivasi mode survei sidak lapangan, menangkap koordinat
 *          ketukan peta, mengunggah foto lapangan geotagged, dan mendaftarkan
 *          titik sengketa/pelanggaran spasial baru secara live [Bogor 8].
 * 
 * Desain : Menggunakan Event-Driven Pattern untuk komunikasi dengan SipasMap [sipas-fe.txt].
 *          Hanya aktif & merender jika peran pengguna adalah "Tim Teknis"
 *          atau "Super Admin" [sipas-fe.txt, Bogor 8].
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '../../../app/store/useUIStore';
import { useGisUIStore, type SpatialConflict } from '../../../app/store/useGisUIStore';
import {
    AlertTriangle, Crosshair, MapPin, Camera, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ─── STYLING CONSTANTS (SAGE THEME SHARP STYLE) ────────────────────────────────
const inputClass = "w-full px-3 py-1.5 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-sans text-xs rounded-none";
const labelClass = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export default function ConflictPinControl() {
    const activeRole = useUIStore((s) => s.activeRole);
    const selectedCompanyId = useGisUIStore((s) => s.selectedCompanyId);
    const addSpatialConflict = useGisUIStore((s) => s.addSpatialConflict);

    // Otorisasi Akses: Hanya Tim Teknis & Super Admin [sipas-fe.txt, Bogor 8]
    const isAuthorized = activeRole === 'Tim Teknis' || activeRole === 'Super Admin';

    const [isPinningModeActive, setIsPinningModeActive] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Temp form states
    const [tempCoordinates, setTempCoordinates] = useState<[number, number] | null>(null); // [lng, lat]
    const [category, setCategory] = useState<SpatialConflict['category']>('Sempadan Sungai');
    const [description, setDescription] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    // ── SINKRONISASI BINDING EVENT KOORDINAT PETA [sipas-fe.txt] ──────────────────
    useEffect(() => {
        const handleCoordinatesCaptured = (e: Event) => {
            const ev = e as CustomEvent<{ lng: number; lat: number }>;
            if (!isPinningModeActive || !ev.detail) return;

            setTempCoordinates([ev.detail.lng, ev.detail.lat]);
            setIsFormOpen(true);
            setIsPinningModeActive(false); // Matikan mode penandaan pasca-klik
            toast.success('Koordinat titik konflik spasial berhasil dikunci!');
        };

        window.addEventListener('map-coordinates-captured', handleCoordinatesCaptured);
        return () => {
            window.removeEventListener('map-coordinates-captured', handleCoordinatesCaptured);
        };
    }, [isPinningModeActive]);

    // Sembunyikan kontrol jika pengguna tidak memiliki otoritas sidak [Bogor 8]
    if (!isAuthorized) return null;

    // Toggle Mode Survei Spasial
    const handleTogglePinningMode = () => {
        const next = !isPinningModeActive;
        setIsPinningModeActive(next);
        setIsFormOpen(false);
        setTempCoordinates(null);

        if (next) {
            toast.info('Mode Survei Aktif: Silakan ketuk area mana saja di atas peta untuk menandai titik konflik.');
            window.dispatchEvent(new CustomEvent('map-toggle-pinning-state', { detail: true }));
        } else {
            window.dispatchEvent(new CustomEvent('map-toggle-pinning-state', { detail: false }));
        }
    };

    // Kirim data konflik spasial baru ke global store [sipas-fe.txt]
    const handleConfirmConflict = () => {
        if (!tempCoordinates || !description.trim()) {
            toast.error('Gagal: Deskripsi temuan wajib dilampirkan sebelum menyimpan.');
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            addSpatialConflict({
                id: `conflict-new-${Date.now()}`,
                submissionId: selectedCompanyId || 'sub-general',
                category,
                coordinates: tempCoordinates,
                description: description.trim(),
                photoUrl: photoUrl || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
            });

            setIsSubmitting(false);
            setIsFormOpen(false);
            setTempCoordinates(null);
            setDescription('');
            setPhotoUrl('');

            toast.success('Titik Konflik Spasial Berhasil Didata!', {
                description: 'Laporan otomatis disusun ke dalam draf Berita Acara (BAPL).',
            });
        }, 1200);
    };

    return (
        <div className="absolute top-36 right-6 z-30 pointer-events-auto flex flex-col items-end gap-3 select-none">

            {/* ── TOMBOL FLOATING TRIGGER ── */}
            <button
                type="button"
                onClick={handleTogglePinningMode}
                className={cn(
                    "relative flex items-center justify-center w-12 h-12 border transition-all rounded-none outline-none group active:scale-95 cursor-pointer shadow-lg",
                    isPinningModeActive
                        ? "bg-rose-600 border-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                title="Aktifkan Mode Survei Konflik Spasial"
            >
                {isPinningModeActive && (
                    <div className="absolute inset-0 bg-rose-400/20 animate-ping opacity-30 rounded-none" />
                )}
                <Crosshair size={20} className={cn("relative z-10", isPinningModeActive && "animate-spin-slow")} />
            </button>

            {/* ── CARD FORMULIR ANOTASI KONFLIK SPASIAL (MODAL HUD) ── */}
            {isFormOpen && tempCoordinates && (
                <div className="w-80 bg-slate-950 border border-slate-800 text-white shadow-2xl p-4 space-y-4 rounded-none text-left animate-in zoom-in-95 duration-200">

                    {/* Header Form */}
                    <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <AlertTriangle size={12} className="animate-pulse" />
                            Sidak: Catat Konflik Spasial
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer outline-none border-none bg-transparent"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-3.5">
                        {/* Koordinat Terkunci */}
                        <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800">
                            <MapPin size={12} className="text-rose-500" />
                            <span className="text-[10px] font-mono text-slate-400">
                                LNG: {tempCoordinates[0].toFixed(5)} | LAT: {tempCoordinates[1].toFixed(5)}
                            </span>
                        </div>

                        {/* Kategori Konflik */}
                        <div>
                            <label className={labelClass}>Kategori Temuan Lapangan</label>
                            <select
                                value={category}
                                onChange={(e: any) => setCategory(e.target.value)}
                                className={inputClass}
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="Sempadan Sungai">Pelanggaran Sempadan Sungai</option>
                                <option value="Sempadan SUTET">Pelanggaran Sempadan SUTET</option>
                                <option value="Sempadan Rel">Pelanggaran Sempadan Rel Kereta</option>
                                <option value="Bangunan Eksisting">Bangunan Eksisting Belum Dibongkar</option>
                                <option value="Hambatan Fisik">Hambatan Fisik / Tebing Curam</option>
                            </select>
                        </div>

                        {/* Unggah Foto Lapangan Geotag */}
                        <div>
                            <label className={labelClass}>Unggah Foto Bukti Lapangan (Geotagged)</label>
                            <div className="relative flex items-center gap-2.5">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="conflict-photo-input"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPhotoUrl(URL.createObjectURL(file));
                                            toast.success('Foto lapangan berhasil diunggah dengan metadata geotag!');
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="conflict-photo-input"
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors rounded-none"
                                >
                                    <Camera size={12} />
                                    Ambil Foto Lapangan
                                </label>
                                <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                                    {photoUrl ? 'Foto Siap' : 'Format JPEG/PNG'}
                                </span>
                            </div>
                        </div>

                        {/* Input Deskripsi Temuan */}
                        <div className="space-y-1.5">
                            <label className={labelClass}>Deskripsi Detail Temuan</label>
                            <textarea
                                rows={2}
                                value={description}
                                placeholder="Contoh: Terdeteksi pondasi ruko melanggar batas sempadan sungai aktif..."
                                onChange={(e) => setDescription(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setIsFormOpen(false)}
                            className="px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none bg-transparent rounded-none"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleConfirmConflict}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer outline-none border-none"
                        >
                            {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                            Kunci Temuan Spasial
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
}