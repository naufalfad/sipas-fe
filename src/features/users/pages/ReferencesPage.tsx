import { Database } from 'lucide-react';

export default function ReferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Data Master Referensi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Pengelolaan data pendukung seperti Kecamatan, Kelurahan, jenis perumahan, dan kriteria zonasi.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full text-slate-500 mb-4">
          <Database className="h-10 w-10 text-teal-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Referensi Zonasi & Wilayah</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Kelola master data pendukung untuk klasifikasi site plan yang terintegrasi.
        </p>
      </div>
    </div>
  );
}
