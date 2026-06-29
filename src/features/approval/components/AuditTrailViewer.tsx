/**
 * ============================================================================
 * AUDIT TRAIL VIEWER — Tabel Kepatuhan Hukum & Jejak Digital [Bogor 7]
 * ============================================================================
 * Peran  : Menampilkan catatan riwayat kronologis dari setiap perubahan status,
 *          justifikasi dispensasi manual, nama aktor, dan status validasi TTE BSrE
 *          pada satu permohonan terpilih [Bogor 7].
 * 
 * Desain : Komponen modular terkecil (Atomic Design) [sipas-fe.txt].
 *          Siku kaku (rounded-none) untuk menyelaraskan dengan sistem desain GEOSIPAS [sipas-fe.txt].
 *          Menyaring log terpusat di useUIStore berdasarkan submissionId secara asinkron.
 * ============================================================================
 */

import { useMemo } from 'react';
import { useUIStore, type AuditTrailEntry } from '@/app/store/useUIStore';
import {
    ShieldCheck, History, Fingerprint, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditTrailViewerProps {
    submissionId: string;
}

export default function AuditTrailViewer({ submissionId }: AuditTrailViewerProps) {
    const auditTrailLogs = useUIStore((s) => s.auditTrailLogs);

    // ── SINKRONISASI FILTER DATA: Saring log berdasarkan ID Permohonan ──────────
    const filteredLogs = useMemo(() => {
        return auditTrailLogs
            .filter((log) => log.submissionId === submissionId)
            // Urutkan berdasarkan waktu terbaru (descending)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditTrailLogs, submissionId]);

    // Format Helper: Tanggal & Waktu Lokal
    const formatDateTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
        } catch {
            return isoString;
        }
    };

    // Resolusi Warna Badge Aksi Teknis (Sesuai standardisasi Bab 4)
    const getActionBadgeClass = (action: AuditTrailEntry['action']) => {
        switch (action) {
            case 'APPROVE_KABID_TTE':
            case 'SIGN_BUPATI_TTE':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'VERIFY_ADMIN_APPROVED':
            case 'VERIFY_TECHNICAL_APPROVED':
                return 'bg-[#e8f2ea] text-[#415D43] border-[#A1CCA5]/60';
            case 'VERIFY_ADMIN_REJECTED':
            case 'VERIFY_TECHNICAL_REJECTED':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'REGISTER_DISPENSASI':
            case 'FORCE_BYPASS_WARNING':
                return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getActionLabel = (action: AuditTrailEntry['action']) => {
        const labels: Record<AuditTrailEntry['action'], string> = {
            'SUBMIT_UNIFIED_FORM': 'Submit Dokumen',
            'VERIFY_ADMIN_APPROVED': 'Lolos Admin',
            'VERIFY_ADMIN_REJECTED': 'Admin Ditolak',
            'VERIFY_TECHNICAL_APPROVED': 'Lolos Spasial',
            'VERIFY_TECHNICAL_REJECTED': 'Teknis Ditolak',
            'REGISTER_DISPENSASI': 'Input Dispensasi',
            'APPROVE_KABID_TTE': 'TTE KABID',
            'SIGN_BUPATI_TTE': 'TTE BUPATI',
            'FORCE_BYPASS_WARNING': 'Bypass Warning'
        };
        return labels[action] || action;
    };

    return (
        <div className="bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left font-sans text-slate-700">

            {/* HEADER TABEL */}
            <div className="flex justify-between items-center border-b border-border/60 pb-3 select-none">
                <div className="text-left">
                    <h3 className="text-sm font-bold text-[#111D13] flex items-center gap-2">
                        <History className="h-4.5 w-4.5 text-primary" />
                        Jejak Audit & Kepatuhan Hukum (Audit Trail Logs)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Catatan kronologis mutasi berkas permohonan, penandatanganan TTE, dan audit jaringan otomatis [Bogor 7].
                    </p>
                </div>
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>

            {/* TIMELINE TABLE GRID */}
            {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 select-none">
                    Belum ada jejak log aktivitas terdaftar untuk berkas pengajuan ini.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                                <th className="px-4 py-3">Waktu Log</th>
                                <th className="px-4 py-3">Aktor & Peran</th>
                                <th className="px-4 py-3">Tindakan</th>
                                <th className="px-4 py-3">Catatan Justifikasi / Hasil</th>
                                <th className="px-4 py-3 text-right">Kredensial & TTE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredLogs.map((log) => {
                                const hasTTE = !!log.digitalSignatureHash;

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                        {/* Kolom 1: Waktu Log */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                                            {formatDateTime(log.timestamp)}
                                        </td>

                                        {/* Kolom 2: Aktor & Peran */}
                                        <td className="px-4 py-3.5">
                                            <div>
                                                <div className="font-bold text-slate-800">{log.actorName}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{log.role}</div>
                                            </div>
                                        </td>

                                        {/* Kolom 3: Tindakan */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-none text-[8.5px] font-black uppercase tracking-widest border leading-none shadow-none",
                                                getActionBadgeClass(log.action)
                                            )}>
                                                {getActionLabel(log.action)}
                                            </span>
                                        </td>

                                        {/* Kolom 4: Catatan Justifikasi */}
                                        <td className="px-4 py-3.5 text-left text-slate-500 leading-normal max-w-xs whitespace-normal break-words">
                                            {log.notes}
                                        </td>

                                        {/* Kolom 5: Kredensial IP & Hash TTE */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {/* IP Address */}
                                                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                                                    <Globe size={9} /> {log.ipAddress}
                                                </span>

                                                {/* Status TTE BSrE [Bogor 7] */}
                                                {hasTTE ? (
                                                    <div className="relative group inline-block">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-wider rounded-none leading-none cursor-help">
                                                            <Fingerprint size={10} /> TTE Terverifikasi
                                                        </span>

                                                        {/* Hover Tooltip untuk Menampilkan Hash Kriptografi Asli */}
                                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-[#111D13] text-white text-[9px] font-mono p-2.5 pointer-events-none z-50 rounded-none shadow-md border border-[#709775]/25 max-w-[240px] whitespace-normal break-all">
                                                            <span className="font-bold text-[#A1CCA5] block uppercase text-[8px] tracking-widest mb-1">SHA-256 Hash Enkripsi:</span>
                                                            {log.digitalSignatureHash}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tanpa TTE</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FOOTER INFORMASIONAL */}
            <div className="p-4 bg-[#e8f2ea]/30 border border-primary/10 flex items-start gap-2 text-left">
                <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 select-none">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none block">Proteksi Integritas Catatan</span>
                    <p className="text-[9px] font-semibold leading-normal text-slate-500 text-justify">
                        Seluruh data log di atas dikunci secara kriptografis menggunakan algoritma SHA-256. Setiap modifikasi atau manipulasi data log secara sepihak akan dideteksi oleh sistem keamanan sebagai kegagalan integritas data (*database integrity failure*).
                    </p>
                </div>
            </div>

        </div>
    );
}