import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Manajemen Pengguna
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Daftar pengguna dan hak akses akun sistem GEOSIPAS.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full text-slate-500 mb-4">
          <UserCog className="h-10 w-10 text-teal-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Pengaturan Pengguna</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Kelola data developer (Pemohon), Tim Teknis, Dinas terkait, Admin SIPAS, dan Kepala Bidang.
        </p>
      </div>
    </div>
  );
}
