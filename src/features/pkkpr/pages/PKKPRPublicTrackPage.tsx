import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  Loader2
} from 'lucide-react';
import { pkkprApi } from '../api/pkkprApi';
import type { PKKPRPublicTrackingData } from '../types/pkkpr.types';
import { API_BASE_URL } from '@/config';

export const PKKPRPublicTrackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryId = searchParams.get('id') || '';
  const queryNo = searchParams.get('no') || '';

  const [inputNo, setInputNo] = useState(queryNo || queryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PKKPRPublicTrackingData | null>(null);

  const fetchTracking = async (idVal?: string, noVal?: string) => {
    if (!idVal && !noVal) return;
    try {
      setLoading(true);
      setError(null);
      const res = await pkkprApi.getPublicTracking({ id: idVal, no: noVal });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Berkas permohonan tidak ditemukan dalam sistem.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryId || queryNo) {
      fetchTracking(queryId, queryNo);
    }
  }, [queryId, queryNo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNo.trim()) return;
    setSearchParams({ no: inputNo.trim() });
    fetchTracking(undefined, inputNo.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-600 selection:text-white font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Instansi Pemkab Bogor */}
        <header className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm space-y-3">
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-[9px] font-black text-emerald-900 tracking-wider">PEMKAB</span>
                <span className="text-[11px] font-black text-amber-600 tracking-tighter -mt-1">BOGOR</span>
              </div>
            </div>
            <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-800">
              Pemerintah Kabupaten Bogor • DPMPTSP
            </p>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Pelacakan Status Berkas Permohonan PKKPR
            </h1>
            <p className="text-xs text-slate-500">
              Pantau tahapan verifikasi dan posisi berkas Anda secara transparan dan mandiri
            </p>
          </div>

          {/* Form Pencarian Nomor Registrasi */}
          <form onSubmit={handleSearchSubmit} className="mt-4 max-w-md mx-auto flex gap-2">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputNo}
                onChange={(e) => setInputNo(e.target.value)}
                placeholder="Masukkan Nomor Registrasi (REG-PKKPR/...)"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lacak</span>}
            </button>
          </form>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
            <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Sedang mencari riwayat berkas di server...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-bold text-red-950">{error}</p>
            <p className="text-xs text-slate-500">
              Pastikan nomor registrasi sesuai dengan nomor yang tertera pada lembaran tanda terima Anda.
            </p>
          </div>
        )}

        {/* Tracking Details */}
        {!loading && data && (
          <div className="space-y-6">
            
            {/* Kartu Ringkasan Berkas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Nomor Registrasi Sistem
                  </span>
                  <div className="text-lg sm:text-xl font-mono font-black text-slate-900">
                    {data.submission_no}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Tahap: {data.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold block">Nama Pemohon:</span>
                  <strong className="text-slate-900 text-sm">{data.applicant_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold block">Tanggal Pengajuan:</span>
                  <span className="text-slate-700 font-medium">{data.submitted_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold block">Rencana Kegiatan:</span>
                  <span className="text-slate-700">{data.activity_description}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold block">Lokasi:</span>
                  <span className="text-slate-700">{data.location}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  Standar Pelayanan (SLA): <strong className="text-slate-800">{data.estimated_completion_days} hari kerja</strong>
                </span>

                <a
                  href={`${API_BASE_URL}${data.receipt_pdf_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cetak Lembar Tanda Terima (PDF)</span>
                </a>
              </div>
            </div>

            {/* Stepper Progres Alur Berkas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Progres Tahapan Alur Pelayanan Berkas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diproses secara berjenjang oleh tim verifikator dinas Kabupaten Bogor
                </p>
              </div>

              <div className="space-y-6">
                {data.steps.map((step, idx) => {
                  const isCompleted = step.status === 'COMPLETED';
                  const isInProgress = step.status === 'IN_PROGRESS';

                  return (
                    <div key={step.step_number} className="flex items-start gap-4 relative">
                      {/* Garis Penghubung Stepper */}
                      {idx < data.steps.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                            isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Lingkaran Indikator Tahap */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 flex-shrink-0 shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-700 text-white'
                            : isInProgress
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step_number}
                      </div>

                      {/* Rincian Tahap */}
                      <div className="flex-grow pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              isCompleted || isInProgress ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.name}
                          </h4>

                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {isCompleted ? 'Selesai' : isInProgress ? 'Sedang Berlangsung' : 'Menunggu'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pelaksana: <span className="text-slate-700 font-medium">{step.actor}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <footer className="text-center text-xs text-slate-400 space-y-1 pt-2">
              <p>Sistem Informasi Pelayanan Pengesahan Tata Ruang (GEOSIPAS)</p>
              <p className="text-[11px]">Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Kabupaten Bogor</p>
            </footer>

          </div>
        )}
      </div>
    </div>
  );
};
