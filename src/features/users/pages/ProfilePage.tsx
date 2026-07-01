import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import {
  User,
  Mail,
  Shield,
  Building,
  Lock,
  Phone,
  Fingerprint,
  Save
} from 'lucide-react';
import { useState } from 'react';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(9, 'Nomor telepon tidak valid'),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: 'Password baru minimal 6 karakter'
  })
});

type ProfileSchemaType = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const activeRole = user ? normalizeRole(user.role) : 'Pemohon';
  const isDinasActor = ['Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'].includes(activeRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: ''
    }
  });

  const onSubmit = async (data: ProfileSchemaType) => {
    setIsLoading(true);
    const toastId = toast.loading('Sedang memperbarui profil...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal memperbarui profil.');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      toast.success('Profil berhasil diperbarui!', { id: toastId });
      setValue('password', ''); // Clear password input
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = user?.role === 'PEMOHON'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces';

  return (
    <div className="space-y-6 font-sans">
      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <User className="h-6 w-6 text-primary" />
          Profil Saya
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Detail informasi akun dan hak akses otoritas dalam sistem manajemen spasial GEOSIPAS.
        </p>
      </div>

      {/* ─── SEKSI 2: GRID LAYOUT PROFIL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Ringkasan Avatar & Status */}
        <div className="bg-white border border-border p-6 text-center space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="relative inline-block">
            <img
              src={avatarUrl}
              alt={user?.full_name}
              className="h-28 w-28 rounded-full border-4 border-slate-100 object-cover mx-auto"
            />
            <span className="absolute bottom-1 right-1 bg-[#415D43] border-2 border-white p-1.5 rounded-full text-white shadow-sm">
              <Shield className="h-3.5 w-3.5" />
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#111D13] leading-snug">{user?.full_name}</h3>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] uppercase rounded-none">
              {activeRole}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50/50 border border-border/40">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Status Akun</span>
              <span className="text-xs font-bold text-emerald-700 block mt-1">
                {user?.status === 'Aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50/50 border border-border/40">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TTE BSrE</span>
              <span className="text-xs font-bold text-emerald-700 block mt-1">
                {isDinasActor ? 'Tersertifikasi' : 'Tidak Ada'}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Data Diri & Form Edit */}
        <div className="lg:col-span-2 bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left space-y-6">
          
          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
                Informasi Pengguna
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    {...register('full_name')}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                  />
                  {errors.full_name && (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      {errors.full_name.message}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Surel / Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="email"
                      {...register('email')}
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Telepon Kontak
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      {...register('phone')}
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      {errors.phone.message}
                    </span>
                  )}
                </div>

                {/* Password Baru */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Ubah Password (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="Masukkan password baru"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                    />
                  </div>
                  {errors.password && (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      {errors.password.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian 2: Informasi Kelembagaan / Perusahaan */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 pb-2 uppercase tracking-wide mb-4">
                {isDinasActor ? 'Detail Instansi Kedinasan' : 'Detail Asosiasi Pengembang'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lembaga / Perusahaan</span>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 p-2 bg-slate-50 border border-border/60">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    {user?.company || (isDinasActor ? 'Dinas PUPR Kabupaten Bogor' : 'Mitra Pengembang')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    {isDinasActor ? 'NIP Pegawai (Aparatur)' : 'Nomor Induk Berusaha (NIB)'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 block p-2 bg-slate-50 border border-border/60">
                    {user?.nip || '-'}
                  </span>
                </div>
                {isDinasActor && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sertifikat TTE (BSrE)</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 p-2 bg-slate-50 border border-border/60">
                      <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                      Aktif / Terverifikasi Resmi
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Simpan Perubahan */}
            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center p-3 bg-[#415D43] hover:opacity-95 text-white font-bold transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-[#415D43] cursor-pointer outline-none disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
