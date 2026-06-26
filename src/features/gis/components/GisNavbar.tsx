import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import type { UserRole } from '@/app/store/useUIStore';
import {
    ChevronLeft, Globe, LogOut, ChevronDown,
    RefreshCw, Share2
} from 'lucide-react';
import { toast } from 'sonner';

export default function GisNavbar() {
    const navigate = useNavigate();
    const { activeRole, userProfile, setActiveRole } = useUIStore();
    const [roleMenuOpen, setRoleMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Inisial Nama (Fase 4 - Security Audit Trail)
    const getInitials = (name: string) => {
        return name?.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || 'AD';
    };

    // Otoritas rute kembali yang reaktif terhadap tingkat wewenang (GRASP: Information Expert)
    const handleBackClick = () => {
        // Menghindari hardcoded, mengarahkan kembali ke dashboard administratif
        navigate('/dashboard');
        toast.info('Keluar dari kanvas spasial imersif.');
    };

    const rolesList: UserRole[] = ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'];

    return (
        <nav className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 z-50 pointer-events-auto select-none rounded-none shadow-sm">

            {/* SISI KIRI: Tombol Kembali & Identitas Branding */}
            <div className="flex items-center gap-5">
                <button
                    onClick={handleBackClick}
                    className="group flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-all rounded-none outline-none border-none bg-transparent cursor-pointer"
                >
                    <div className="p-1.5 group-hover:bg-slate-50 transition-colors rounded-none">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                        Kembali
                    </span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <Link to="/" className="flex items-center gap-2.5 active:scale-95 transition-transform group rounded-none outline-none text-left">
                    <Globe size={22} className="text-teal-600 group-hover:text-teal-700 transition-colors shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col leading-none">
                        <span className="font-sans font-semibold text-lg md:text-xl tracking-tight text-slate-800">
                            Geo <span className="text-teal-600">SIPAS</span>
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 hidden sm:block">
                            Tata Ruang Daerah
                        </span>
                    </div>
                </Link>
            </div>

            {/* SISI KANAN: Alat Sinkronisasi, Simulasi Role, & Profil Sesi */}
            <div className="flex items-center gap-1 md:gap-3">

                {/* Tombol Sync Spasial */}
                <button
                    onClick={() => toast.success('Peta zonasi RTRW berhasil disinkronkan.')}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-all active:scale-95 rounded-none outline-none border-none bg-transparent cursor-pointer"
                    title="Sinkronisasi Data Spasial"
                >
                    <RefreshCw size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
                        Sync Peta
                    </span>
                </button>

                {/* Tombol Bagikan Tautan */}
                <button
                    onClick={() => toast.success('Koordinat pusat peta disalin ke memori.')}
                    className="flex items-center justify-center px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-all active:scale-95 rounded-none outline-none border-none bg-transparent cursor-pointer"
                    title="Bagikan Tampilan"
                >
                    <Share2 size={14} />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                {/* SIMULATOR SWITCHER ROLE WIDGET (Sesuai Kebutuhan Demo SIPAS) */}
                <div className="relative">
                    <button
                        onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-none text-[10px] font-black uppercase tracking-wider hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors border-none outline-none cursor-pointer shadow-sm"
                    >
                        <span>Simulasi: {activeRole}</span>
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    {roleMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setRoleMenuOpen(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-none shadow-lg border border-slate-100 z-20 overflow-hidden text-xs py-1">
                                <div className="px-3 py-2 text-[9px] font-black text-slate-400 bg-slate-50 border-b uppercase tracking-widest leading-none">
                                    Ganti Hak Akses
                                </div>
                                {rolesList.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            setActiveRole(role);
                                            setRoleMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors block border-none bg-transparent font-semibold text-slate-700 cursor-pointer ${activeRole === role ? 'font-black text-teal-600 bg-teal-50/30' : ''
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* PROFIL AKUN SESI AKTIF */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center space-x-3 focus:outline-none border-none bg-transparent cursor-pointer"
                    >
                        <div className="w-8 h-8 bg-teal-100 flex items-center justify-center text-[11px] font-black text-teal-700 rounded-none shadow-sm">
                            {getInitials(userProfile.name)}
                        </div>
                        <div className="hidden md:block text-left select-none leading-none">
                            <div className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                                {userProfile.name}
                            </div>
                            <span className="text-[8px] text-teal-600 font-bold uppercase tracking-widest block mt-1 leading-none">
                                {activeRole}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
                    </button>

                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-none shadow-lg border border-slate-150 z-20 overflow-hidden py-1 text-xs text-left">
                                <div className="px-4 py-3 border-b">
                                    <p className="font-bold text-slate-800">{userProfile.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">{userProfile.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setProfileOpen(false);
                                        toast.error('Keluar sistem disimulasikan.');
                                    }}
                                    className="w-full flex items-center px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-left border-none bg-transparent font-bold cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4 mr-3 text-rose-500" />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
}