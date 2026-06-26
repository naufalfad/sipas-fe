import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';

export default function SitePlanDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/siteplan/daftar" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Detail Site Plan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi spasial dan dokumen legalitas Site Plan {id || '#ID'}.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Informasi Spasial Site Plan</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Site plan ini telah terverifikasi secara spasial. Anda dapat mengunduh file CAD asli atau melihat poligon di GIS Viewer.
        </p>
        <div className="flex gap-4">
          <Link to="/gis" className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-none font-medium text-sm transition-all">
            <Map className="h-4 w-4" />
            Tampilkan di Peta GIS
          </Link>
        </div>
      </div>
    </div>
  );
}
