import { useUIStore } from '@/app/store/useUIStore';
import {
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  Lock,
  Phone,
  Fingerprint
} from 'lucide-react';

export default function ProfilePage() {
  const { userProfile, activeRole } = useUIStore();

  const isDinasActor = ['Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'].includes(activeRole);

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
              src={userProfile.avatar}
              alt={userProfile.name}
              className="h-28 w-28 rounded-full border-4 border-slate-100 object-cover mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
              }}
            />
            <span className="absolute bottom-1 right-1 bg-[#415D43] border-2 border-white p-1.5 rounded-full text-white shadow-sm">
              <Shield className="h-3.5 w-3.5" />
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#111D13] leading-snug">{userProfile.name}</h3>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] uppercase rounded-none">
              {activeRole}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50/50 border border-border/40">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Status Akun</span>
              <span className="text-xs font-bold text-emerald-700 block mt-1">Aktif</span>
            </div>
            <div className="p-2.5 bg-slate-50/50 border border-border/40">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TTE BSrE</span>
              <span className="text-xs font-bold text-emerald-700 block mt-1">Tersertifikasi</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Data Diri */}
        <div className="lg:col-span-2 bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left space-y-6">
          
          {/* Bagian 1: Informasi Akun Utama */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
              Informasi Pengguna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Lengkap</span>
                <span className="text-xs font-bold text-slate-700 block">{userProfile.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Surel / Email</span>
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {userProfile.email}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Telepon Kontak</span>
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  +62 812-3456-7890
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Otoritas Peran Peran</span>
                <span className="text-xs font-bold text-slate-700 block">{activeRole}</span>
              </div>
            </div>
          </div>

          {/* Bagian 2: Informasi Kelembagaan / Perusahaan */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
              {isDinasActor ? 'Detail Instansi Kedinasan' : 'Detail Asosiasi Pengembang'}
            </h3>
            
            {isDinasActor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lembaga / Instansi</span>
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    Dinas PUPR Kabupaten Bogor
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">NIP Pegawai (Aparatur)</span>
                  <span className="text-xs font-mono font-bold text-slate-700 block">19880412 201212 1 002</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Unit Kerja / Bidang</span>
                  <span className="text-xs font-bold text-slate-700 block">Bidang Penataan Ruang</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sertifikat TTE (BSrE)</span>
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                    Aktif / Terverifikasi Resmi
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Perusahaan Developer</span>
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    PT Maju Jaya Sentosa
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor Induk Berusaha (NIB)</span>
                  <span className="text-xs font-mono font-bold text-slate-700 block">9120301938192</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat Kantor Pengembang</span>
                  <span className="text-xs font-semibold text-slate-600 block">Gedung Sentosa Lt. 4, Jl. Jend. Sudirman No. 10, Jakarta Pusat</span>
                </div>
              </div>
            )}
          </div>

          {/* Bagian 3: Keamanan & Sistem */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
              Keamanan & Riwayat Log
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="flex items-center space-x-3 p-3 bg-slate-50/50 border border-border/40">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Kunjungan Terakhir</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">2026-06-26 08:30 WITA</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-50/50 border border-border/40">
                <Lock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Metode Otentikasi</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">Single Sign-On (SSO) Dinas</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
