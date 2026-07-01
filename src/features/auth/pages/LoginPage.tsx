import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/useAuthStore';
import { Lock, User, Layers, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsLoading(true);
    const toastId = toast.loading('Sedang mengautentikasi...');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: data.username,
          password: data.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Username atau password salah.');
      }

      const resData = await response.json();
      login(resData.access_token, resData.user);

      toast.success(`Selamat datang kembali, ${resData.user.full_name}!`, { id: toastId });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Gagal login. Cek koneksi server Anda.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center items-center p-4 font-sans select-none text-foreground">
      {/* ─── KARTU UTAMA LOGIN ─── */}
      <div className="w-full max-w-md bg-white border border-[#DAE4DB] p-8 shadow-[6px_6px_0px_0px_rgba(65,93,67,0.08)] space-y-6">
        
        {/* Branding & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#e8f2ea] text-[#415D43] mb-1">
            <Layers className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold text-[#111D13] tracking-tight uppercase">
            Masuk GEOSIPAS
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sistem Informasi Pelayanan Pengesahan Site Plan Digital Kabupaten Bogor
          </p>
        </div>

        {/* Formulir Input */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          {/* Input Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                {...register('username')}
                placeholder="Masukkan username Anda"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] focus:ring-1 focus:ring-[#415D43] text-slate-800 disabled:opacity-50"
              />
            </div>
            {errors.username && (
              <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                {errors.username.message}
              </span>
            )}
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] focus:ring-1 focus:ring-[#415D43] text-slate-800 disabled:opacity-50"
              />
            </div>
            {errors.password && (
              <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center p-3 bg-[#415D43] hover:opacity-95 text-white font-bold transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-[#415D43] cursor-pointer outline-none disabled:opacity-60"
          >
            <span>{isLoading ? 'Sedang Masuk...' : 'Autentikasi Akun'}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
          <span>Belum punya akun?</span>
          <Link to="/register" className="text-[#415D43] hover:underline font-bold">
            Daftar Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}
