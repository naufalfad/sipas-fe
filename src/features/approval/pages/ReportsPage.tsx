import { FileBarChart2 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Laporan Realisasi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Statistik pengesahan site plan dan master plan secara berkala.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-600 mb-4">
          <FileBarChart2 className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Modul Laporan</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Menyajikan grafik pengesahan bulanan, per wilayah kecamatan, dan rekapitulasi data developer.
        </p>
      </div>
    </div>
  );
}
