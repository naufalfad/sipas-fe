import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Layers, ArrowRight, User, Mail, Lock, Phone,
  Briefcase, KeyRound, Loader2, ArrowLeft
} from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useUIStore } from '@/app/store/useUIStore';

// Skema Validasi Form hanya untuk Pemohon (Nama Perusahaan Wajib Diisi)
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  phone: z.string().min(9, 'Nomor telepon tidak valid'),
  company: z.string().min(3, 'Nama Perusahaan wajib diisi untuk verifikasi institusi pengembang')
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const { setActiveRole, setUserProfile } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [sessionId, setSessionId] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

  // Timer Hitung Mundur untuk Kirim Ulang OTP
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema)
  });

  // Logika Pengatur Timer Hitung Mundur
  useEffect(() => {
    if (step === 'OTP' && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timer]);

  // Langkah 1: Kirim data pendaftaran dan minta OTP ke WhatsApp (REVISED: Protected Parsing)
  const handleInitiateRegister = async (data: RegisterSchemaType) => {
    setIsLoading(true);
    const toastId = toast.loading('Mengirimkan kode verifikasi OTP ke WhatsApp Anda...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: 'PEMOHON' // Otomatis mengunci peran sebagai Pemohon
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.detail || 'Gagal mengirimkan OTP. Cek nomor HP Anda.');
      }

      setSessionId(resData.session_id);
      setStep('OTP');
      setTimer(60); // Reset timer ke 60 detik
      toast.success('Kode OTP berhasil dikirim ke nomor WhatsApp Anda!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghubungi server.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 2: Verifikasi OTP yang dimasukkan pengguna (REVISED: Protected Parsing)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Memverifikasi kode OTP...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          plain_otp: otpCode
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.detail || 'Verifikasi gagal. Periksa kembali kode OTP Anda.');
      }

      // Sukses: Daftarkan sesi login langsung (Instant Auto-Login)
      loginStore(resData.access_token, resData.user);

      try {
        setActiveRole('Pemohon', true);
        setUserProfile({
          name: resData.user.full_name,
          email: resData.user.email,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
        });
      } catch (err) {
        console.warn('Gagal memutakhirkan state UI:', err);
      }

      toast.success('Verifikasi sukses! Selamat datang di GEOSIPAS.', { id: toastId });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Verifikasi kode OTP gagal.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Kirim Ulang OTP jika masa berlaku habis atau tidak terkirim
  const handleResendOtp = async () => {
    if (timer > 0) return;
    const currentValues = getValues();
    await handleInitiateRegister(currentValues);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center items-center p-4 font-sans select-none text-foreground">
      <div className="w-full max-w-xl bg-white border border-[#DAE4DB] p-8 shadow-[6px_6px_0px_0px_rgba(65,93,67,0.08)] space-y-6">

        { }
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-[#e8f2ea] text-[#415D43] mb-1">
            <Layers className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold text-[#111D13] tracking-tight uppercase">
            Pendaftaran Kredensial GEOSIPAS
          </h2>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
            Khusus Akun Pendaftar Mitra Pengembang / Developer Kabupaten Bogor
          </p>
        </div>

        { }
        {step === 'FORM' ? (
          <form onSubmit={handleSubmit(handleInitiateRegister)} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              { }
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
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50 no-capitalize"
                  />
                </div>
                {errors.username && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.username.message}</p>}
              </div>

              { }
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
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50 no-capitalize"
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.email.message}</p>}
              </div>

              { }
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nama Lengkap Pemohon
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    {...register('full_name')}
                    placeholder="Masukkan nama lengkap Anda"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                  />
                </div>
                {errors.full_name && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.full_name.message}</p>}
              </div>

              { }
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kata Sandi (Password)
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
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50 no-capitalize"
                  />
                </div>
                {errors.password && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.password.message}</p>}
              </div>

              { }
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nomor WhatsApp Penerima OTP
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                    {...register('phone', {
                      onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
                    })}
                  />
                </div>
                {errors.phone && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.phone.message}</p>}
              </div>

              { }
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
                    placeholder="Contoh: PT Graha Persada"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-semibold focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                  />
                </div>
                {errors.company && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.company.message}</p>}
              </div>

            </div>

            { }
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center p-3.5 bg-[#415D43] hover:opacity-95 text-white font-bold transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-[#415D43] cursor-pointer outline-none disabled:opacity-60"
            >
              <span>{isLoading ? 'Sedang Memproses...' : 'Kirim Kode OTP Verifikasi'}</span>
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (

          <form onSubmit={handleVerifyOtp} className="space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-normal flex items-start gap-2.5">
              <KeyRound className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verifikasi WhatsApp OTP Aktif</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Kode OTP telah terkirim. Harap masukkan 6 digit kode OTP yang Anda terima di aplikasi WhatsApp untuk mengaktifkan akun pendaftaran Anda.</p>
              </div>
            </div>

            { }
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Masukkan 6 Digit Kode OTP
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <KeyRound className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 123456"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f4f7f4]/40 border border-[#DAE4DB] text-xs font-bold font-mono tracking-widest text-center focus:outline-none focus:border-[#415D43] text-slate-800 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            { }
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => { setStep('FORM'); setOtpCode(''); }}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer font-bold"
              >
                <ArrowLeft size={12} />
                Kembali ke Form
              </button>

              <button
                type="button"
                disabled={timer > 0 || isLoading}
                onClick={handleResendOtp}
                className={`font-bold transition-all border-none bg-transparent ${timer > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[#415D43] hover:underline cursor-pointer'
                  }`}
              >
                {timer > 0 ? `Kirim Ulang OTP (${timer}s)` : 'Kirim Ulang Kode OTP'}
              </button>
            </div>

            { }
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full flex items-center justify-center p-3.5 bg-[#415D43] hover:opacity-95 text-white font-bold transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-[#415D43] cursor-pointer outline-none disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Sedang Mengaktifkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi & Aktifkan Akun</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        { }
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
          <span>Sudah memiliki akun?</span>
          <Link to="/login" className="text-[#415D43] hover:underline font-bold">
            Masuk Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}