import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Layers, ArrowRight, Shield, User, Mail, Lock, Phone, Briefcase } from 'lucide-react';
import { useState } from 'react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  role: z.enum(['PEMOHON', 'ADMIN', 'TIM_TEKNIS', 'KABID_PUPR']),
  nip: z.string().min(6, 'NIP/NIB minimal 6 karakter'),
  company: z.string().optional(),
  phone: z.string().min(9, 'Nomor telepon tidak valid')
}).refine(data => {
  if (data.role === 'PEMOHON' && (!data.company || data.company.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Nama Perusahaan wajib diisi untuk Pemohon/Developer',
  path: ['company']
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'PEMOHON'
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsLoading(true);
    const toastId = toast.loading('Sedang mendaftarkan akun...');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registrasi gagal. Harap coba lagi.');
      }

      toast.success('Pendaftaran sukses! Silakan login.', { id: toastId });
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center items-center p-4 font-sans select-none text-foreground">
      {/* ─── KARTU UTAMA REGISTRASI ─── */}
      <div className="w-full max-w-xl bg-white border border-[#DAE4DB] p-8 shadow-[6px_6px_0px_0px_rgba(65,93,67,0.08)] space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-[#e8f2ea] text-[#415D43] mb-1">
            <Layers className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold text-[#111D13] tracking-tight uppercase">
            Pendaftaran Kredensial GEOSIPAS
          </h2>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
            Daftarkan akun Developer Mitra atau Aparatur Dinas PUPR Kabupaten Bogor
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          {/* Pemilihan Peran (Developer vs Aparatur Dinas) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tipe Pengguna (Peran)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { role: 'PEMOHON', label: 'Developer' },
                { role: 'ADMIN', label: 'Admin SIPAS' },
                { role: 'TIM_TEKNIS', label: 'Tim Teknis' },
                { role: 'KABID_PUPR', label: 'Kabid PUPR' }
              ].map(opt => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setValue('role', opt.role as any)}
                  className={`py-2 text-[10px] font-bold uppercase border transition-all text-center cursor-pointer outline-none ${
                    selectedRole === opt.role
                      ? 'bg-[#415D43] text-white border-[#415D43]'
                      : 'bg-white text-slate-600 border-[#DAE4DB] hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <User className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  {...register('username')}
                  placeholder="Contoh: ahmad_fauzi"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                />
              </div>
              {errors.username && (
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Contoh: developer@company.com"
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

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <User className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  {...register('full_name')}
                  placeholder="Masukkan nama lengkap"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                />
              </div>
              {errors.full_name && (
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                  {errors.full_name.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Minimal 6 karakter"
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

            {/* NIP / NIB */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {selectedRole === 'PEMOHON' ? 'NIB (Nomor Induk Berusaha)' : 'NIP (Nomor Induk Pegawai)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Shield className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  {...register('nip')}
                  placeholder={selectedRole === 'PEMOHON' ? 'Masukkan NIB perushaan' : 'Masukkan NIP aparatur'}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                />
              </div>
              {errors.nip && (
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                  {errors.nip.message}
                </span>
              )}
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Nomor Telepon
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="Contoh: 081234567890"
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
          </div>

          {/* Perusahaan/Asosiasi (Hanya tampil jika Pemohon/Developer) */}
          {selectedRole === 'PEMOHON' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Nama Perusahaan / Developer
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  {...register('company')}
                  placeholder="Masukkan nama perseroan terbatas (PT)"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                />
              </div>
              {errors.company && (
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                  {errors.company.message}
                </span>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center p-3 bg-[#415D43] hover:opacity-95 text-white font-bold transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-[#415D43] cursor-pointer outline-none disabled:opacity-60"
          >
            <span>{isLoading ? 'Sedang Mendaftarkan...' : 'Daftarkan Akun Baru'}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>

        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
          <span>Sudah memiliki kredensial?</span>
          <Link to="/login" className="text-[#415D43] hover:underline font-bold">
            Masuk Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}
