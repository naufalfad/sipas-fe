import { useConfigStore } from '@/app/store/useConfigStore';
import { Settings, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  const { maintenanceMessage } = useConfigStore();

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center items-center p-4 font-sans select-none text-foreground">
      {/* ─── CONTAINER KARTU MAINTENANCE ─── */}
      <div className="w-full max-w-lg bg-white border border-[#DAE4DB] p-10 shadow-[8px_8px_0px_0px_rgba(65,93,67,0.08)] text-center space-y-8">
        
        {/* Ikon Cog Animasi */}
        <div className="relative inline-flex items-center justify-center">
          {/* Gir Besar (Berputar lambat searah jarum jam) */}
          <div className="p-5 bg-[#e8f2ea] text-primary rounded-full animate-[spin_10s_linear_infinite]">
            <Settings className="h-14 w-14" />
          </div>
          {/* Gir Kecil (Berputar cepat berlawanan arah jarum jam) */}
          <div className="absolute -top-1 -right-1 p-2 bg-accent/40 text-primary rounded-full animate-[spin_4s_linear_infinite_reverse]">
            <Settings className="h-6 w-6" />
          </div>
        </div>

        {/* Branding & Judul */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Sistem Sedang Pemeliharaan</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111D13] tracking-tight">
            MAINTENANCE MODE
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Mohon maaf atas ketidaknyamanan Anda. Aplikasi GEOSIPAS Kabupaten Bogor saat ini sedang mengalami pemeliharaan rutin.
          </p>
        </div>

        {/* Kotak Pesan Pemeliharaan Kustom */}
        <div className="bg-[#fcfdfc] border border-dashed border-[#DAE4DB] p-5 rounded-none text-left space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pesan Admin Sistem:</h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {maintenanceMessage || 'Sistem sedang ditingkatkan untuk memberikan layanan spasial yang lebih optimal.'}
          </p>
        </div>

        {/* Footer info & Tombol Login Khusus Admin */}
        <div className="space-y-4 pt-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Petugas Dinas & Administrator tetap dapat masuk untuk pengelolaan sistem
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary"
          >
            <span>Masuk Sebagai Admin</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
      
      {/* Footer Branding */}
      <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-6">
        GEOSIPAS KABUPATEN BOGOR &copy; 2026
      </span>
    </div>
  );
}
