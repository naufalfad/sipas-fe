import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { API_BASE_URL } from '@/config';
import {
  UserCheck,
  Plus,
  Mail,
  Shield,
  Edit2,
  Lock,
  UserPlus,
  Briefcase,
  X
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  nip: string;
  phone: string;
  company: string;
  status: 'Aktif' | 'Nonaktif';
}

export default function KaryawanPage() {
  const [employeesList, setEmployeesList] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);

  // Form states
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('Dinas PUPR Kabupaten Bogor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TIM_TEKNIS'); // Default to Tim Teknis

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Gagal memuat data dari server.');
      const data = await response.json();

      // Filter out PEMOHON, only keep official employees
      const filtered = data
        .filter((u: any) => u.role !== 'PEMOHON')
        .map((u: any, idx: number) => ({
          id: `emp-${idx + 1}`,
          username: u.username,
          name: u.full_name,
          email: u.email,
          role: u.role,
          nip: u.nip || '—',
          phone: u.phone || '—',
          company: u.company || 'Dinas PUPR',
          status: u.status
        }));
      setEmployeesList(filtered);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar karyawan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setNip('');
    setName('');
    setEmail('');
    setPhone('');
    setCompany('Dinas PUPR Kabupaten Bogor');
    setUsername('');
    setPassword('');
    setRole('TIM_TEKNIS');
  };

  // 1. ADD EMPLOYEE (REVISED: Bearer Token Integration & Protected Parsing)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !name || !password) {
      toast.error('Harap isi semua kolom wajib (*)');
      return;
    }

    const toastId = toast.loading('Mendaftarkan karyawan baru...');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Suntik token Admin untuk role guard
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: name,
          role,
          nip: nip || null,
          company,
          phone: phone || null
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mendaftarkan karyawan.');
      }

      toast.success('Karyawan & akun dinas berhasil didaftarkan!', { id: toastId });
      setIsAddOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.', { id: toastId });
    }
  };

  // 2. OPEN EDIT MODAL
  const openEditModal = (emp: EmployeeItem) => {
    setSelectedEmp(emp);
    setNip(emp.nip !== '—' ? emp.nip : '');
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone !== '—' ? emp.phone : '');
    setCompany(emp.company);
    setRole(emp.role);
    setPassword('');
    setIsEditOpen(true);
  };

  // 3. EDIT EMPLOYEE SUBMIT (REVISED: Protected Parsing)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const toastId = toast.loading('Memperbarui data karyawan...');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/${selectedEmp.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          full_name: name,
          role,
          nip: nip || null,
          company,
          phone: phone || null,
          password: password || null
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal memperbarui data.');
      }

      toast.success('Data karyawan berhasil diperbarui!', { id: toastId });
      setIsEditOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.', { id: toastId });
    }
  };

  // 4. TOGGLE STATUS (REVISED: Dynamic Error Extraction & Protected Parsing)
  const handleToggleStatus = async (emp: EmployeeItem) => {
    const nextStatus = emp.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const actionText = nextStatus === 'Aktif' ? 'mengaktifkan' : 'menonaktifkan';

    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} akun ${emp.name}?`)) return;

    const toastId = toast.loading(`Sedang ${actionText} akun...`);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/${emp.username}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mengubah status keaktifan pegawai.');
      }

      toast.success(`Akun berhasil diubah menjadi ${nextStatus}.`, { id: toastId });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status.', { id: toastId });
    }
  };

  // Filter employees by search query
  const filteredEmployees = employeesList.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.nip.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: 'Aktif' | 'Nonaktif') => {
    if (status === 'Aktif') {
      return 'bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/60';
    }
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── HEADER HALAMAN ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-primary" />
            Master Data Karyawan & Akun Dinas
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Kelola data staf dinas (Admin, Tim Teknis, Kabid, Kadis) terintegrasi langsung dengan kredensial login sistem.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* ─── FILTER & CARI ─── */}
      <div className="bg-white border border-border p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari NIP, nama, atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 pl-9 focus:bg-white focus:border-primary focus:outline-none transition-all"
          />
          <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Total Staf Terdaftar: {filteredEmployees.length} Orang
        </span>
      </div>

      {/* ─── TABEL KARYAWAN ─── */}
      <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase">
                <th className="px-4 py-3">NIP / Nama</th>
                <th className="px-4 py-3">Peran Dinas</th>
                <th className="px-4 py-3">Username & Kontak</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Sedang memuat data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada data karyawan dinas.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.username} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">NIP: {emp.nip}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center space-x-1 font-bold text-slate-700">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span>{normalizeRole(emp.role)}</span>
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{emp.company}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-600">@{emp.username}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{emp.email} | {emp.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold border leading-none cursor-pointer transition-colors ${getStatusBadge(emp.status)}`}
                      >
                        {emp.status}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Karyawan"
                          className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer border border-slate-200 hover:border-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL ADD KARYAWAN ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-[#111D13]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DAE4DB] shadow-2xl max-w-lg w-full p-6 relative text-left">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b">
              <UserPlus className="h-4.5 w-4.5 text-primary" />
              Daftarkan Karyawan Dinas Baru
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIP Pegawai</label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="1992081520..."
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Dinas *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@sipas.go.id"
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instansi / Bidang Dinas</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Dinas Pekerjaan Umum & Penataan Ruang (PUPR)"
                  className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-[10px] font-bold text-[#415D43] uppercase tracking-wider">Kredensial Login Akun Dinas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username Akun *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="budi_sipas"
                      className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi (Password) *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 Karakter"
                      className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Wewenang Peran (Role) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary font-semibold text-slate-700"
                  >
                    <option value="ADMIN">Admin SIPAS (Verifikasi Administrasi)</option>
                    <option value="TIM_TEKNIS">Tim Teknis Tata Ruang (Verifikasi Spasial/GIS)</option>
                    <option value="KABID_PUPR">Kepala Bidang Penataan Ruang (Persetujuan Draf)</option>
                    <option value="KADIS">Kepala Dinas DPMPTSP (Tanda Tangan TTE)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-none border border-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(65,93,67,0.15)] transition-all cursor-pointer"
                >
                  Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT KARYAWAN ─── */}
      {isEditOpen && selectedEmp && (
        <div className="fixed inset-0 bg-[#111D13]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DAE4DB] shadow-2xl max-w-lg w-full p-6 relative text-left">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b">
              <UserCheck className="h-4.5 w-4.5 text-primary" />
              Edit Data Karyawan Dinas
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 border p-3 text-[11px] text-slate-500 space-y-0.5">
                <p>Username Akun: <span className="font-bold text-slate-700">@{selectedEmp.username}</span></p>
                <p>Kredensial ini bersifat unik dan tidak dapat diubah setelah terdaftar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIP Pegawai</label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="1992081520..."
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Dinas *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@sipas.go.id"
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instansi / Bidang Dinas</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Dinas Pekerjaan Umum & Penataan Ruang (PUPR)"
                  className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Wewenang Peran (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary font-semibold text-slate-700"
                >
                  <option value="ADMIN">Admin SIPAS (Verifikasi Administrasi)</option>
                  <option value="TIM_TEKNIS">Tim Teknis Tata Ruang (Verifikasi Spasial/GIS)</option>
                  <option value="KABID_PUPR">Kepala Bidang Penataan Ruang (Persetujuan Draf)</option>
                  <option value="KADIS">Kepala Dinas DPMPTSP (Tanda Tangan TTE)</option>
                </select>
              </div>

              <div className="border-t pt-3 space-y-1">
                <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Ganti Kata Sandi (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Isi hanya jika ingin mereset password akun"
                  className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-none border border-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#415D43] hover:bg-[#344b36] text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(65,93,67,0.15)] transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}