import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  FileText,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { PKKPRQuotaSummary } from '../types/pkkpr.types';
import { pkkprApi } from '../api/pkkprApi';
import { cn } from '@/lib/utils';

export interface PKKPRQuotaCardProps {
  summary?: PKKPRQuotaSummary | null;
  pkkprId?: string;
  currentProposedAreaM2?: number;
  proposedArea?: number;
  className?: string;
}

export const PKKPRQuotaCard: React.FC<PKKPRQuotaCardProps> = ({
  summary: propSummary,
  pkkprId,
  currentProposedAreaM2,
  proposedArea,
  className
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const effectiveProposedArea = currentProposedAreaM2 ?? proposedArea ?? 0;

  // Jika pkkprId disediakan dan propSummary belum ada, fetch otomatis
  const { data: fetchedSummary, isLoading } = useQuery({
    queryKey: ['pkkpr-quota-summary', pkkprId],
    queryFn: () => pkkprApi.getQuotaSummary(pkkprId!),
    enabled: !!pkkprId && !propSummary,
    staleTime: 60000,
  });

  const summary = propSummary || fetchedSummary;

  if (isLoading) {
    return (
      <div className={cn("p-4 border border-emerald-200 bg-emerald-50/30 flex items-center gap-3 text-xs text-emerald-800", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Memuat data silsilah kuota alokasi lahan PKKPR...</span>
      </div>
    );
  }

  if (!summary) return null;

  const totalArea = summary.total_approved_area_m2;
  const usedArea = summary.used_area_m2;
  const remainingArea = summary.remaining_area_m2;
  const isOverQuota = effectiveProposedArea > remainingArea;
  const projectedRemaining = Math.max(0, remainingArea - effectiveProposedArea);
  const utilizationPct = summary.utilization_percent;

  // Tentukan warna progress bar berdasarkan utilisasi
  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={cn(
      "rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/60 p-5 shadow-sm transition-all duration-300",
      isOverQuota && "border-rose-300 from-rose-50/50",
      className
    )}>
      {/* Header Kartu: Identitas SK & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-emerald-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/80 px-2 py-0.5 rounded-full">
                SK PKKPR Terpilih (Kabupaten Bogor)
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Terbit: {summary.sk_issued_date || 'Sah & Terverifikasi'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span>{summary.sk_number || summary.submission_no}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              Pemohon: <span className="font-semibold text-slate-800">{summary.applicant_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {summary.status}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Utilisasi Kuota Lahan */}
      <div className="my-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Pemanfaatan Kuota Tanah Bertahap (Perbup Bogor No. 4/2025 Pasal 3)
          </span>
          <span className="text-slate-900 font-bold">
            {utilizationPct.toFixed(1)}% Terpakai
          </span>
        </div>
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden p-0.5">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", getProgressColor(utilizationPct))}
            style={{ width: `${Math.min(100, utilizationPct)}%` }}
          />
        </div>
      </div>

      {/* Grid 4 Metrik Lahan Absolut */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Alokasi SK Induk
          </span>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">
            {totalArea.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">m²</span>
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Terpakai Tahap Lalu
          </span>
          <p className="text-sm font-extrabold text-slate-700 mt-0.5">
            {usedArea.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">m²</span>
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {summary.siteplans_count} Tahap Terdaftar
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Sisa Kuota Tersedia
          </span>
          <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
            {remainingArea.toLocaleString('id-ID')} <span className="text-xs font-normal text-emerald-600">m²</span>
          </p>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">
            Maks. untuk tahap ini
          </span>
        </div>

        <div className={cn(
          "p-3 rounded-lg border shadow-xs transition-colors",
          isOverQuota 
            ? "bg-rose-50 border-rose-300 text-rose-900" 
            : "bg-blue-50/70 border-blue-200 text-blue-900"
        )}>
          <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-80">
            Usulan Tahap Ini
          </span>
          <p className="text-sm font-extrabold mt-0.5">
            {effectiveProposedArea > 0 ? effectiveProposedArea.toLocaleString('id-ID') : '0'}{' '}
            <span className="text-xs font-normal opacity-70">m²</span>
          </p>
          <span className="text-[10px] opacity-80 block mt-0.5">
            {isOverQuota ? '❌ Melebihi Kuota!' : `Sisa nanti: ${projectedRemaining.toLocaleString('id-ID')} m²`}
          </span>
        </div>
      </div>

      {/* Banner Peringatan Kuota Terlampaui */}
      {isOverQuota && (
        <div className="my-3 p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Peringatan Kuota Melampaui Izin:</span>
            <p className="mt-0.5 leading-relaxed">
              Luas yang Anda ajukan pada tahap ini ({effectiveProposedArea.toLocaleString('id-ID')} m²) melampaui sisa kuota yang diizinkan oleh SK PKKPR ({remainingArea.toLocaleString('id-ID')} m²). Mohon sesuaikan luas tapak pada Tahap 3 (Data Lokasi) atau ajukan addendum perluasan PKKPR.
            </p>
          </div>
        </div>
      )}

      {/* Parameter Ketetapan Ruang (Envelope RDTR Otomatis) */}
      {summary.envelope && (
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Parameter Intensitas Ruang SK Induk (Autofill Standar):
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {summary.envelope.spatial_zone_code && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                Zonasi: <strong className="text-slate-900">{summary.envelope.spatial_zone_code}</strong> ({summary.envelope.spatial_zone_name || 'RDTR'})
              </span>
            )}
            {summary.envelope.approved_kdb_max != null && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                KDB Maks: <strong className="text-slate-900">{summary.envelope.approved_kdb_max}%</strong>
              </span>
            )}
            {summary.envelope.approved_klb_max != null && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                KLB Maks: <strong className="text-slate-900">{summary.envelope.approved_klb_max}</strong>
              </span>
            )}
            {summary.envelope.approved_kdh_min != null && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                KDH Min: <strong className="text-slate-900">{summary.envelope.approved_kdh_min}%</strong>
              </span>
            )}
            {summary.envelope.approved_gsb_min != null && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                GSB Min: <strong className="text-slate-900">{summary.envelope.approved_gsb_min} m</strong>
              </span>
            )}
            {summary.envelope.approved_max_floors != null && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium text-[11px] border border-slate-200">
                Maks. Lantai: <strong className="text-slate-900">{summary.envelope.approved_max_floors} Lt</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Accordion Riwayat Tahap-tahap Site Plan Sebelumnya */}
      {summary.siteplans && summary.siteplans.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Lihat Daftar {summary.siteplans.length} Site Plan Tahap Sebelumnya
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="mt-2.5 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200 animate-in fade-in duration-200">
              <div className="text-[11px] font-bold text-slate-700 pb-1.5 border-b border-slate-100 grid grid-cols-12 gap-2">
                <span className="col-span-5">Nama Klaster / Tahap</span>
                <span className="col-span-3 text-right">Luas Lahan</span>
                <span className="col-span-4 text-right">Status Berkas</span>
              </div>
              {summary.siteplans.map((sp) => (
                <div key={sp.id_permohonan} className="text-xs text-slate-600 grid grid-cols-12 gap-2 py-1 border-b border-slate-50 last:border-0 items-center">
                  <div className="col-span-5 font-medium truncate text-slate-800" title={sp.housing_name || sp.submission_no}>
                    {sp.housing_name || sp.submission_no}
                  </div>
                  <div className="col-span-3 text-right font-semibold text-slate-700">
                    {sp.land_area.toLocaleString('id-ID')} m²
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {sp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
