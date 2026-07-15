import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { API_BASE_URL } from '@/config';
import {
  UserCog,
  Mail,
  ShieldCheck,
  Lock,
  Search,
  X,
  AlertTriangle
} from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  phone?: string;
  nip?: string;
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal states
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Gagal memuat daftar pengguna.');
      const data = await response.json();
      const mapped = data.map((u: any, idx: number) => ({
        id: `usr-${idx + 1}`,
        username: u.username,
        name: u.full_name,
        email: u.email,
        role: u.role,
        status: u.status,
        phone: u.phone,
        nip: u.nip
      }));
      setUsersList(mapped);
    } catch (err: any) {
      toast.error('Gagal memuat pengguna dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 1. TOGGLE STATUS (REVISED: Dynamic Error Extraction & Protected Parsing)
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const actionText = nextStatus === 'Aktif' ? 'mengaktifkan' : 'menonaktifkan';

    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} akun ${user.name}?`)) return;

    const toastId = toast.loading(`Sedang mengubah status akun...`);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/${user.username}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mengubah status akun.');
      }

      toast.success(`Akun ${user.name} berhasil diubah menjadi ${nextStatus}.`, { id: toastId });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui status keaktifan.', { id: toastId });
    }
  };

  // 2. RESET PASSWORD (REVISED: Protected Parsing)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    const toastId = toast.loading('Mereset kata sandi...');
    try {
      const token = sessionStorage.getItem('token');
      // Call PUT /users/{username} with updated password
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/${selectedUser.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: selectedUser.email,
          full_name: selectedUser.name,
          role: selectedUser.role,
          nip: selectedUser.nip || null,
          phone: selectedUser.phone || null,
          password: newPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mereset password.');
      }

      toast.success(`Password untuk @${selectedUser.username} berhasil diubah!`, { id: toastId });
      setIsResetOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset sandi.', { id: toastId });
    }
  };

  // Filter logic
  const filteredUsers = usersList.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'Semua' || normalizeRole(u.role) === roleFilter;
    const matchesStatus = statusFilter === 'Semua' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadgeClass = (status: 'Aktif' | 'Nonaktif') => {
    if (status === 'Aktif') {
      return 'bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/60';
    }
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <UserCog className="h-6 w-6 text-primary" />
          Manajemen Pengguna Sistem (Akun)
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Pantau status keaktifan akun pemohon/developer, aktifkan/nonaktifkan akun, dan lakukan reset kata sandi dinas secara administratif.
        </p>
      </div>

      {/* ─── FILTERS AREA ─── */}
      <div className="bg-white border border-border p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 pl-9 focus:bg-white focus:border-primary focus:outline-none transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Filter Role */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 text-xs p-2 focus:outline-none focus:bg-white focus:border-primary font-semibold text-slate-700"
          >
            <option value="Semua">Semua Peran</option>
            <option value="Pemohon">Pemohon (Developer)</option>
            <option value="Admin SIPAS">Admin SIPAS</option>
            <option value="Tim Teknis">Tim Teknis</option>
            <option value="Kepala Bidang">Kepala Bidang</option>
            <option value="Kadis">Kadis</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 text-xs p-2 focus:outline-none focus:bg-white focus:border-primary font-semibold text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Total Akun: {filteredUsers.length}
        </div>
      </div>

      {/* ─── TABEL AKUN ─── */}
      <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase">
                <th className="px-4 py-3">Username & Nama</th>
                <th className="px-4 py-3">Email & Kontak</th>
                <th className="px-4 py-3">Hak Akses (Role)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Sedang memuat daftar akun...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada akun yang sesuai kriteria.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-50/40 transition-colors">
                    {/* Username & Nama */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">@{user.username}</p>
                    </td>

                    {/* Email & Kontak */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && <p className="text-[9px] text-slate-400 mt-0.5">Telp: {user.phone}</p>}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center space-x-1.5 text-slate-600 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{normalizeRole(user.role)}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold border leading-none cursor-pointer transition-colors ${getStatusBadgeClass(user.status)}`}
                      >
                        {user.status}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => { setSelectedUser(user); setIsResetOpen(true); }}
                        title="Reset Sandi Akun"
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-[#e8f2ea]/50 border border-slate-200 hover:border-primary transition-colors cursor-pointer outline-none"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── RESET PASSWORD MODAL ─── */}
      {isResetOpen && selectedUser && (
        <div className="fixed inset-0 bg-[#111D13]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DAE4DB] shadow-2xl max-w-sm w-full p-6 relative text-left">
            <button
              onClick={() => setIsResetOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 pb-3 border-b text-rose-600">
              <Lock className="h-4.5 w-4.5" />
              Reset Kata Sandi Akun
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div className="bg-rose-50 border border-rose-100 p-3 text-[11px] text-rose-800 space-y-1 rounded-none flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="leading-relaxed">
                  Tindakan ini akan mengganti paksa sandi untuk akun <span className="font-bold">@{selectedUser.username}</span> ({selectedUser.name}). Pastikan Anda memberikan kata sandi baru ini kepada yang bersangkutan secara aman.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs focus:outline-none focus:bg-white focus:border-primary font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-none border border-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(225,29,72,0.15)] transition-all cursor-pointer border border-rose-700"
                >
                  Reset Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}