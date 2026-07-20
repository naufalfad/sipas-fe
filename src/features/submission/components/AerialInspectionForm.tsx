import React, { useState, useEffect, useRef } from 'react';
import { Video, User, UploadCloud, CheckCircle2, Loader2, HelpCircle, Trash2, AlertTriangle } from 'lucide-react';
import { SubmissionService } from '../services/submission.service';
import { toast } from 'sonner';

interface AerialInspectionFormProps {
    submissionId: string;
    onSuccess?: () => void;
}

interface ExistingAerialLog {
    id: number;
    idPermohonan: string;
    pilotName: string;
    timestamp: string;
    droneVideoUrl: string;
    flightMetadata?: Record<string, any> | null;
    notes?: string | null;
}

export function AerialInspectionForm({ submissionId, onSuccess }: AerialInspectionFormProps) {
    const [pilotName, setPilotName] = useState('');
    const [notes, setNotes] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

    const [isDragActive, setIsDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [existingLog, setExistingLog] = useState<ExistingAerialLog | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ambil dokumentasi video drone yang sudah diunggah sebelumnya (Idempotent View)
    const fetchExistingLog = async () => {
        setLoadingExisting(true);
        try {
            const res = await SubmissionService.getAerialInspection(submissionId);
            if (res && res.data) {
                setExistingLog(res.data);
                setPilotName(res.data.pilotName);
                setNotes(res.data.notes || '');
            } else {
                setExistingLog(null);
            }
        } catch (err) {
            console.error('Gagal memuat log inspeksi udara eksis:', err);
        } finally {
            setLoadingExisting(false);
        }
    };

    useEffect(() => {
        fetchExistingLog();
    }, [submissionId]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const processVideoFile = (file: File) => {
        // Validasi tipe file harus merupakan format video umum
        const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
        if (!isVideo) {
            toast.error('Format file tidak didukung! Harap pilih file video berformat .mp4 atau .mov.');
            return;
        }

        // Validasi ukuran maksimal berkas video drone (100MB)
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_SIZE) {
            toast.error('Gagal: Ukuran file video drone melebihi batas maksimal 100MB.');
            return;
        }

        setVideoFile(file);
        const objectUrl = URL.createObjectURL(file);
        setVideoPreviewUrl(objectUrl);
        toast.success(`Video '${file.name}' siap untuk diunggah.`);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processVideoFile(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processVideoFile(file);
        }
    };

    const handleRemoveSelectedVideo = () => {
        setVideoFile(null);
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
            setVideoPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pilotName.trim()) {
            toast.warning('Nama pilot drone wajib diisi.');
            return;
        }

        if (!videoFile) {
            toast.warning('Berkas rekaman video drone wajib dipilih.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Sedang mengunggah dokumentasi udara ke server...');

        try {
            const formData = new FormData();
            formData.append('pilot_name', pilotName);
            formData.append('notes', notes);
            formData.append('drone_video', videoFile);

            await SubmissionService.createAerialInspection(submissionId, formData);
            toast.success('Log dokumentasi udara drone berhasil disimpan!', { id: toastId });

            handleRemoveSelectedVideo();
            fetchExistingLog();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            let friendlyMsg = err.message || 'Terjadi kesalahan sistem internal.';
            try {
                const parsed = JSON.parse(err.message);
                if (parsed.message) {
                    friendlyMsg = parsed.message;
                    if (parsed.detail && Array.isArray(parsed.detail)) {
                        const details = parsed.detail.map((d: any) => {
                            const field = d.loc ? d.loc[d.loc.length - 1] : '';
                            return `${field ? field + ': ' : ''}${d.msg}`;
                        }).join(', ');
                        friendlyMsg += ` (${details})`;
                    }
                }
            } catch (e) {
                // message is not JSON
            }
            toast.error(`Gagal menyimpan dokumentasi udara: ${friendlyMsg}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 text-left select-none font-sans bg-white">
            {/* TITLE & HEADER */}
            <div className="border-b border-slate-200 pb-2.5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Video size={15} className="text-primary" />
                    Input Bukti Sidak Udara (Aerial Drone Inspection)
                </h4>
                <span className="text-[10px] text-slate-450 block mt-1">
                    Unggah dokumentasi rekaman video udara makro kawasan menggunakan pesawat nirawak (drone) [Slide 6]
                </span>
            </div>

            {/* PANDUAN INSPEKSI UDARA (Flat Panel) */}
            <div className="p-3.5 bg-slate-50 border-l-2 border-slate-400 text-slate-700 text-[10px] space-y-1.5 leading-relaxed">
                <span className="font-bold uppercase text-slate-800 flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-slate-500" />
                    Ketentuan Sidak Udara:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                    <li>Pengunggahan video drone diwajibkan secara mutlak bagi permohonan kategori <strong>PERUMAHAN</strong> dan <strong>INDUSTRI</strong> sebelum berkas diajukan ke Kabid.</li>
                    <li>Kapasitas berkas video yang diunggah dibatasi maksimal berukuran <strong>100 Megabytes (100MB)</strong>.</li>
                    <li>Sistem menerapkan kebijakan *idempotent overwrite*. Pengunggahan video drone baru akan otomatis menghapus file video lama di storage server.</li>
                </ol>
            </div>

            {/* STATUS HISTORIS VIDEO DRONE TERUNGGAH */}
            {loadingExisting ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 text-slate-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>Mendeteksi status unggahan drone sebelumnya...</span>
                </div>
            ) : existingLog ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 text-emerald-800 text-xs leading-normal space-y-3">
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-950">Video Drone Terunggah (OK)</p>
                            <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                                Berkas video udara telah terdaftar aman di server untuk permohonan ini.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-2.5 border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-sans text-slate-600 text-left">
                        <div>
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase tracking-wider">Nama Pilot Drone</span>
                            <span className="font-bold text-slate-800">{existingLog.pilotName}</span>
                        </div>
                        <div>
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase tracking-wider">Tanggal Sidak Udara</span>
                            <span className="font-semibold text-slate-700">{new Date(existingLog.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                        {existingLog.notes && (
                            <div className="col-span-2">
                                <span className="text-[8.5px] text-slate-400 font-bold block uppercase tracking-wider">Catatan Penerbangan</span>
                                <span className="font-medium text-slate-700 italic">"{existingLog.notes}"</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Aksi Spasial:</span>
                        <a
                            href={existingLog.droneVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                        >
                            Putar Rekaman Video Drone Aktif ↗
                        </a>
                    </div>
                </div>
            ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-start gap-2 text-justify">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
                    <span>Dokumentasi sidak udara drone belum terdaftar untuk berkas permohonan ini. Silakan lakukan proses pengunggahan di bawah.</span>
                </div>
            )}

            {/* FORM INPUT FIELDS */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                {/* INPUT NAMA PILOT */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pilot Drone / Penanggung Jawab *</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <User size={13} />
                        </span>
                        <input
                            type="text"
                            value={pilotName}
                            onChange={(e) => setPilotName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-sans"
                            placeholder="Masukkan nama pilot / operator drone..."
                            required
                        />
                    </div>
                </div>

                {/* INPUT DRAG AND DROP ZONE */}
                <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unggah File Rekaman Video Drone (.mp4 / .mov) *</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="video/mp4,video/quicktime"
                        className="hidden"
                    />

                    {videoPreviewUrl ? (
                        <div className="border border-slate-300 p-3.5 bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between gap-3 text-xs text-slate-700 bg-white p-2.5 border border-slate-200">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-teal-600 shrink-0">🎥</span>
                                    <span className="font-bold truncate max-w-[220px]" title={videoFile?.name}>
                                        {videoFile?.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                        ({videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) : 0} MB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveSelectedVideo}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 hover:border-rose-300 rounded-none bg-white cursor-pointer"
                                    title="Hapus video terpilih"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {/* Local Video Preview Player */}
                            <div className="relative border border-slate-200 bg-black aspect-video flex items-center justify-center overflow-hidden">
                                <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                            </div>
                        </div>
                    ) : (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 rounded-none min-h-[160px]
                ${isDragActive
                                    ? 'border-primary bg-secondary/30 scale-[0.99] shadow-inner'
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                                }`}
                        >
                            <UploadCloud size={28} className={isDragActive ? 'text-primary' : 'text-slate-400'} />
                            <div className="space-y-0.5">
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                    {isDragActive ? 'Lepaskan Berkas Sekarang' : 'Seret & Lepas File Video'}
                                </p>
                                <p className="text-[9px] text-slate-400">Atau klik di sini untuk memilih berkas dari folder lokal Anda</p>
                            </div>
                            <span className="text-[8.5px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 mt-2">
                                MAKSIMAL UKURAN BERKAS: 100MB (.MP4 / .MOV)
                            </span>
                        </div>
                    )}
                </div>

                {/* INPUT CATATAN PENERBANGAN */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Rona Udara / Flight Log</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tuliskan catatan teknis rona udara (contoh: kondisi angin bersahabat, vegetasi sekeliling, kecocokan batas dengan citra satelit rujukan, dll)..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-sans"
                    />
                </div>

                {/* ACTION SUBMIT BUTTON */}
                <button
                    type="submit"
                    disabled={isSubmitting || !videoFile || !pilotName.trim()}
                    className="w-full py-2.5 bg-primary hover:opacity-95 text-white font-black text-xs uppercase tracking-widest rounded-none border-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Mentransfer Berkas Drone ke Cloud Storage...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={13} className="text-teal-400" />
                            <span>Simpan Dokumentasi Udara</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}