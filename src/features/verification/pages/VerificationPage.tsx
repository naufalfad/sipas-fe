import { ShieldCheck } from 'lucide-react';

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Verifikasi Dokumen
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Halaman evaluasi berkas administrasi dan teknis pengajuan Site Plan.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600 mb-4">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Evaluasi Pengajuan</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Menu ini dapat digunakan oleh Admin SIPAS (verifikasi administratif) dan Tim Teknis (verifikasi spasial GIS/dokumen CAD).
        </p>
      </div>
    </div>
  );
}
