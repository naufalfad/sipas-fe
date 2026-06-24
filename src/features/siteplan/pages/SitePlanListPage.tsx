import { Layers, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SitePlanListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Daftar Site Plan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Daftar seluruh Site Plan yang telah disetujui, direvisi, maupun sedang dalam proses verifikasi.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-600 mb-4">
          <Layers className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Data Site Plan</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Daftar Site Plan terintegrasi GIS yang memuat informasi koordinat, luas lahan, dan developer.
        </p>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all">
            Filter Site Plan
          </button>
          <Link to="/gis" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
            <Map className="h-4 w-4" />
            Buka GIS Viewer
          </Link>
        </div>
      </div>
    </div>
  );
}
