import { ShieldAlert } from 'lucide-react';

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Manajemen Hak Akses (Role)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi hak akses pengguna berdasarkan level wewenang sistem.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full text-slate-500 mb-4">
          <ShieldAlert className="h-10 w-10 text-teal-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Pengaturan Level Hak Akses</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Hak akses terdaftar: Developer/Pemohon, Admin SIPAS, Tim Teknis Dinas, Kepala Bidang, dan Super Admin.
        </p>
      </div>
    </div>
  );
}
