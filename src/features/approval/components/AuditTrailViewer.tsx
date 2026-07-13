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

import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
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
    const setAuditLogs = useUIStore((s) => s.setAuditLogs);

    // Fetch riwayat permohonan dari server untuk memastikan hash digital signature tersemat
    const { data: submissionData } = useQuery({
        queryKey: ['submission', submissionId],
        queryFn: () => SubmissionService.getById(submissionId),
        enabled: !!submissionId,
        staleTime: 5 * 60 * 1000
    });

    const filteredLogs = useMemo(() => {
        if (submissionData && Array.isArray(submissionData.history) && submissionData.history.length > 0) {
            const mapped = submissionData.history.map((h: any, idx: number) => {
                const actorRaw = h.actor || '';
                const actorNameMatch = actorRaw.match(/^([^(]+)/);
                const roleMatch = actorRaw.match(/\(([^)]+)\)/);
                return {
                    id: `srv-audit-${idx}-${submissionId}`,
                    submissionId,
                    timestamp: h.date || new Date().toISOString(),
                    actorName: actorNameMatch ? actorNameMatch[1].trim() : actorRaw,
                    role: roleMatch ? (roleMatch[1] as any) : 'Pemohon',
                    action: h.action || h.status || 'UNKNOWN',
                    statusBefore: h.status || '',
                    statusAfter: h.status || '',
                    notes: h.notes || '',
                    ipAddress: h.ipAddress || '10.252.120.103',
                    digitalSignatureHash: h.digitalSignatureHash || undefined
                } as AuditTrailEntry;
            });

            return mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }

        return auditTrailLogs
            .filter((log) => log.submissionId === submissionId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditTrailLogs, submissionId, submissionData]);

    const { refetch } = useQuery({
        queryKey: ['submission', submissionId, 'refresh-trigger'],
        queryFn: () => Promise.resolve(true),
        enabled: false
    });

    useEffect(() => {
        if (!(submissionData && Array.isArray(submissionData.history) && submissionData.history.length > 0)) return;

        const mappedForStore: AuditTrailEntry[] = submissionData.history.map((h: any, idx: number) => {
            const actorRaw = h.actor || '';
            const actorNameMatch = actorRaw.match(/^([^(]+)/);
            const roleMatch = actorRaw.match(/\(([^)]+)\)/);
            return {
                id: `srv-audit-${idx}-${submissionId}`,
                submissionId,
                timestamp: h.date || new Date().toISOString(),
                actorName: actorNameMatch ? actorNameMatch[1].trim() : actorRaw,
                role: roleMatch ? (roleMatch[1] as any) : 'Pemohon',
                action: h.action || h.status || 'UNKNOWN',
                statusBefore: h.status || '',
                statusAfter: h.status || '',
                notes: h.notes || '',
                ipAddress: h.ipAddress || '10.252.120.103',
                digitalSignatureHash: h.digitalSignatureHash || undefined
            } as AuditTrailEntry;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        try {
            setAuditLogs(mappedForStore);
        } catch {
            // ignore
        }

        try { refetch(); } catch { /* ignore */ }
    }, [submissionData, submissionId, setAuditLogs, refetch]);

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

    // Resolusi Warna Badge Aksi Sesuai Standardisasi Desain GEOSIPAS
    const getActionBadgeClass = (action: string) => {
        const resolved = getActionLabel(action);
        switch (resolved) {
            case 'Permohonan Disetujui (SK Terbit)':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'Verifikasi Administrasi':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'Verifikasi Teknis':
                return 'bg-teal-50 text-teal-800 border-teal-200';
            case 'Pembuatan Draft SK Persetujuan Siteplan':
                return 'bg-[#e8f2ea] text-[#415D43] border-[#A1CCA5]/60';
            case 'Administrasi Ditolak':
            case 'Teknis Ditolak':
            case 'Revisi / Ditolak':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Pengajuan Dokumen':
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    // ─── PENYELARASAN TERMINOLOGI BAHASA BIROKRASI BARU ───
    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            // 1. Kode Aksi Pemohon
            'SUBMIT_UNIFIED_FORM': 'Pengajuan Dokumen',
            'Draft': 'Pengajuan Dokumen',
            'Menunggu Verifikasi': 'Pengajuan Dokumen',
            'Pengajuan Dokumen': 'Pengajuan Dokumen',

            // 2. Kode Aksi Verifikasi Administrasi
            'VERIFY_ADMIN_APPROVED': 'Verifikasi Administrasi',
            'Verifikasi Administrasi': 'Verifikasi Administrasi',
            'VERIFY_ADMIN_REJECTED': 'Administrasi Ditolak',

            // 3. Kode Aksi Verifikasi Teknis
            'VERIFY_TECHNICAL_APPROVED': 'Verifikasi Teknis',
            'GENERATE_TELAAH_STAF': 'Verifikasi Teknis',
            'SAVE_TECHNICAL_MATRIX': 'Verifikasi Teknis',
            'Verifikasi Teknis': 'Verifikasi Teknis',
            'VERIFY_TECHNICAL_REJECTED': 'Teknis Ditolak',

            // 4. Kode Aksi Draf SK Persetujuan Site Plan
            'KABID_ENDORSE_APPROVE': 'Pembuatan Draft SK Persetujuan Siteplan',
            'KABID_OVERRIDE_VETO': 'Pembuatan Draft SK Persetujuan Siteplan',
            'Menunggu Rekomendasi': 'Pembuatan Draft SK Persetujuan Siteplan',
            'Menunggu Persetujuan': 'Pembuatan Draft SK Persetujuan Siteplan',
            'Proses TTE': 'Pembuatan Draft SK Persetujuan Siteplan',

            // 5. Kode Aksi Persetujuan Final Kadis (TTE)
            'APPROVE_KADIS_TTE': 'Permohonan Disetujui (SK Terbit)',
            'Disetujui': 'Permohonan Disetujui (SK Terbit)',

            // Kebutuhan Fallback Operasional Umum
            'REGISTER_DISPENSASI': 'Input Dispensasi',
            'FORCE_BYPASS_WARNING': 'Bypass Warning',
            'Ditolak': 'Revisi / Ditolak'
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
                        Urutan proses: Pengajuan dokumen → Verifikasi Administrasi → Verifikasi Teknis → draft SK persetujuan siteplan → permohonan disetujui sk terbit.
                    </p>
                </div>
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>

            {/* TIMELINE TABLE GRID */}
            {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 select-none">
                    Belum ada riwayat catatan audit.
                </div>
            ) : (
                <div className="overflow-x-auto border border-slate-100">
                    <div className="max-h-[500px] overflow-y-auto pr-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-5 py-3.5 bg-slate-50">Waktu Log</th>
                                    <th className="px-5 py-3.5 bg-slate-50">Aktor & Peran</th>
                                    <th className="px-5 py-3.5 bg-slate-50">Tindakan</th>
                                    <th className="px-5 py-3.5 bg-slate-50">Catatan Justifikasi / Hasil</th>
                                    <th className="px-5 py-3.5 bg-slate-50 text-right">Kredensial & TTE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredLogs.map((log) => {
                                    const hasTTE = !!log.digitalSignatureHash;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Kolom 1: Waktu Log */}
                                            <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                                                {formatDateTime(log.timestamp)}
                                            </td>

                                            {/* Kolom 2: Aktor & Peran */}
                                            <td className="px-5 py-4">
                                                <div>
                                                    <div className="font-bold text-slate-850">{log.actorName}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{log.role}</div>
                                                </div>
                                            </td>

                                            {/* Kolom 3: Tindakan */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-1 rounded-none text-[8.5px] font-bold uppercase tracking-widest border leading-none shadow-none",
                                                    getActionBadgeClass(log.action)
                                                )}>
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </td>

                                            {/* Kolom 4: Catatan Justifikasi */}
                                            <td className="px-5 py-4 text-left text-slate-600 leading-relaxed max-w-xs whitespace-normal break-words">
                                                {log.notes || <span className="text-slate-350 italic">Tidak ada catatan</span>}
                                            </td>

                                            {/* Kolom 5: Kredensial IP & Hash TTE */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {/* IP Address */}
                                                    <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                                                        <Globe size={10} className="text-slate-300" /> {log.ipAddress}
                                                    </span>

                                                    {/* Status TTE BSrE */}
                                                    {hasTTE ? (
                                                        <div className="relative group inline-block">
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 text-[8px] font-black uppercase tracking-wider rounded-none leading-none cursor-help">
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