import React from 'react';
import type { PKKPRStatus } from '../types/pkkpr.types';

interface Props {
  status: PKKPRStatus;
  className?: string;
}

export const PKKPRStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'PENGAJUAN_BERKAS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VERIFIKASI_ADMINISTRASI':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'KAJIAN_TEKNIS_SPASIAL':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SIDANG_FPR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MENUNGGU_REKOMENDASI_KABID':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'MENUNGGU_TTE_KADIS':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'DISETUJUI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'DITOLAK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TIDAK_BERLAKU':
        return 'bg-gray-200 text-gray-500 border-gray-300 line-through';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'DRAFT':
        return 'Draf Pengajuan';
      case 'PENGAJUAN_BERKAS':
        return 'Menunggu Verifikasi Admin';
      case 'VERIFIKASI_ADMINISTRASI':
        return 'Sedang Diverifikasi Admin';
      case 'KAJIAN_TEKNIS_SPASIAL':
        return 'Kajian Spasial PUPR';
      case 'SIDANG_FPR':
        return 'Tahap Sidang Komite FPR';
      case 'MENUNGGU_REKOMENDASI_KABID':
        return 'Perumusan Draf SK Kabid';
      case 'MENUNGGU_TTE_KADIS':
        return 'Menunggu TTE Kadis';
      case 'DISETUJUI':
        return 'SK PKKPR Terbit (Disetujui)';
      case 'DITOLAK':
        return 'Ditolak / Revisi';
      case 'TIDAK_BERLAKU':
        return 'Tidak Berlaku';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {getLabel()}
    </span>
  );
};
