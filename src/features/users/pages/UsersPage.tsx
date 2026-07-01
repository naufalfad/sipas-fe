import { useState, useEffect } from 'react';
import { mockUsers } from '@/mock/users/users';
import { toast } from 'sonner';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import {
  UserCog,
  Plus,
  Mail,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const mapped = data.map((u: any, idx: number) => ({
        id: `usr-${idx + 1}`,
        username: u.username,
        name: u.full_name,
        email: u.email,
        role: normalizeRole(u.role),
        status: u.status
      }));
      setUsersList(mapped);
    } catch (err) {
      console.warn('[UsersPage] Gagal memuat dari BE, menggunakan mock data:', err);
      // fallback
      const fallback = mockUsers.map(u => ({
        ...u,
        username: u.email.split('@')[0]
      }));
      setUsersList(fallback as UserItem[]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Penyelarasan warna badge status ke dalam palet organik baru kita (Celadon & Rose Pastel)
  const getStatusBadgeClass = (status: 'Aktif' | 'Nonaktif') => {
    switch (status) {
      case 'Aktif':
        return 'bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/60'; // Celadon soft green
      case 'Nonaktif':
        return 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'; // Rose pastel red
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-200';
    }
  };

  const handleEditUser = (name: string) => {
    window.alert(`Mengedit profil akun: ${name}`);
  };

  const handleDeleteUser = async (username: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan akun ${name}?`)) {
      const toastId = toast.loading('Memproses penonaktifan akun...');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/v1/auth/users/${username}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Nonaktif' })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Gagal mengubah status pengguna.');
        }
        toast.success(`Akun ${name} berhasil dinonaktifkan.`, { id: toastId });
        fetchUsers();
      } catch (err: any) {
        toast.error(err.message || 'Gagal merubah status.', { id: toastId });
        // Local fallback
        setUsersList(prev =>
          prev.map(u => u.username === username ? { ...u, status: 'Nonaktif' } : u)
        );
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <UserCog className="h-6 w-6 text-primary" />
          Manajemen Pengguna Sistem
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Kelola data kredensial, hak akses, tingkat otorisasi, dan status keaktifan akun pengguna GEOSIPAS.
        </p>
      </div>

      {/* ─── SEKSI 2: WORKSPACE SPLIT (GRID DATA TABEL & FORM ACTIONS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Tabel Pengguna Terdaftar */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Daftar Pengguna Aktif</h3>
              <p className="text-[10px] text-slate-400 mt-1">Daftar pengembang (developer), tim teknis dinas, dan jajaran pimpinan daerah.</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-secondary px-2 py-0.5 border border-border">
              {usersList.length} Akun Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Kontak & Email</th>
                  <th className="px-4 py-3">Hak Akses</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Nama Lengkap */}
                    <td className="px-4 py-3.5 font-bold text-slate-800 text-left">
                      {user.name}
                    </td>

                    {/* Kontak/Email */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-[#709775] shrink-0" />
                        <span className="font-mono text-[10px] truncate max-w-[150px]">{user.email}</span>
                      </div>
                    </td>

                    {/* Hak Akses (Role) */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{user.role}</span>
                      </div>
                    </td>

                    {/* Status Akun */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold border leading-none ${getStatusBadgeClass(user.status)}`}>
                        {user.status}
                      </span>
                    </td>

                    {/* Tombol Tindakan */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex space-x-1.5 select-none">

                        {/* Edit Button */}
                        <div className="relative group inline-block">
                          <button
                            onClick={() => handleEditUser(user.name)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 border-none bg-transparent transition-colors cursor-pointer outline-none"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-medium px-2 py-1 pointer-events-none z-50 rounded-none shadow-md">
                            Edit Akun
                            <div className="absolute top-full right-2.5 -mt-1 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>

                        {/* Delete/Deactivate Button */}
                        {user.status === 'Aktif' && (
                          <div className="relative group inline-block">
                            <button
                              onClick={() => handleDeleteUser(user.username || user.id, user.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent transition-colors cursor-pointer outline-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-medium px-2 py-1 pointer-events-none z-50 rounded-none shadow-md">
                              Nonaktifkan
                              <div className="absolute top-full right-2.5 -mt-1 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Administrasi Tambah Akun Baru */}
        <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-5 text-left select-none">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Administrasi Akun</h3>
            <p className="text-[10px] text-slate-400 mt-1">Daftarkan akun personil dinas baru atau developer mitra pengembang Kabupaten Bogor.</p>
          </div>

          <div className="space-y-4 pt-1">

            {/* Tombol Tambah Pengguna Baru */}
            <button
              onClick={() => window.alert('Membuka dialog pembuatan akun pengguna baru…')}
              className="w-full flex items-center justify-center p-3.5 bg-primary hover:opacity-95 text-white font-bold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer outline-none"
            >
              <Plus className="h-4.5 w-4.5 text-white" />
              <span>Daftarkan Akun Baru</span>
            </button>

            {/* Audit Trail Note Box */}
            <div className="border border-border/80 p-4 bg-[#e8f2ea]/20 space-y-1">
              <h4 className="text-[10px] font-bold text-[#415D43] uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Audit Trail Otoritas
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal text-justify">
                Seluruh pembuatan, perubahan peran (*role assignment*), dan penonaktifan akun akan terekam secara aman pada *Security Audit Log* sistem untuk menjamin akuntabilitas pengesahan site plan.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}