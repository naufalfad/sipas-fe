import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import type { UserRole } from '@/app/store/useUIStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useConfigStore } from '@/app/store/useConfigStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { SubmissionService } from '@/features/submission/services/submission.service';
import {
  LayoutDashboard,
  ClipboardList,
  Layers,
  ShieldCheck,
  Map,
  FileBarChart2,
  Database,
  Users,
  ShieldAlert,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Settings
} from 'lucide-react';

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  submenu?: {
    title: string;
    path: string;
    icon: React.ComponentType<any>;
    roles: UserRole[];
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis'],
  },
  {
    title: 'Pengajuan Site Plan',
    icon: ClipboardList,
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis'],
    submenu: [
      {
        title: 'Daftar Pengajuan',
        path: '/pengajuan/daftar',
        icon: ClipboardList,
        roles: ['Pemohon', 'Kepala Bidang', 'Kadis'],
      },
      {
        title: 'Verifikasi Saya',
        path: '/pengajuan/verifikasi-saya',
        icon: ClipboardList,
        roles: ['Admin SIPAS', 'Tim Teknis'],
      },
      {
        title: 'Pengajuan Baru',
        path: '/pengajuan/tambah',
        icon: ClipboardList,
        roles: ['Pemohon'],
      },
    ],
  },
  {
    title: 'Site Plan',
    icon: Layers,
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis'],
    submenu: [
      {
        title: 'Daftar Site Plan',
        path: '/siteplan/daftar',
        icon: Layers,
        roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis'],
      },
    ],
  },
  {
    title: 'Verifikasi',
    path: '/verifikasi',
    icon: ShieldAlert,
    // SOD: Hanya pejabat operasional penilai (Admin SIPAS dan Tim Teknis) yang berwenang.
    roles: ['Admin SIPAS', 'Tim Teknis'],
  },
  {
    title: 'Persetujuan TTE',
    path: '/persetujuan',
    icon: ShieldCheck,
    // SOD: Pembubuhan TTE adalah kewenangan eksklusif Kepala Dinas (Kadis).
    roles: ['Kadis'],
  },
  {
    title: 'GIS Viewer',
    path: '/gis',
    icon: Map,
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis'],
  },
  {
    title: 'Laporan',
    path: '/laporan',
    icon: FileBarChart2,
    roles: ['Admin SIPAS', 'Kepala Bidang', 'Kadis'],
  },
  {
    title: 'Master Data',
    icon: Database,
    // SOD: Master Data (User, Role, Referensi) adalah domain eksklusif Super Admin.
    roles: ['Super Admin'],
    submenu: [
      {
        title: 'Akun (User)',
        path: '/master/pengguna',
        icon: Users,
        roles: ['Super Admin'],
      },
      {
        title: 'Karyawan Staf',
        path: '/master/karyawan',
        icon: Briefcase,
        roles: ['Super Admin'],
      },
      {
        title: 'Role & Otoritas',
        path: '/master/role',
        icon: ShieldCheck,
        roles: ['Super Admin'],
      },

      {
        title: 'Konfigurasi Sistem',
        path: '/master/konfigurasi',
        icon: Settings,
        roles: ['Super Admin'],
      },
      {
        title: 'Log Aktivitas',
        path: '/master/log-aktivitas',
        icon: ClipboardList,
        roles: ['Super Admin'],
      },
    ],
  },
];

export default function DashboardLayout() {
  const { sidebarOpen, activeRole: uiActiveRole, userProfile: uiUserProfile, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { fetchConfig } = useConfigStore();

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const activeRole = user ? (normalizeRole(user.role) as UserRole) : uiActiveRole;
  const userProfile = user ? {
    name: user.full_name,
    email: user.email,
    avatar: user.role === 'PEMOHON'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
      : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces'
  } : uiUserProfile;

  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    if (profileOpen || notifOpen) {
      document.body.classList.add('header-dropdown-open');
    } else {
      document.body.classList.remove('header-dropdown-open');
    }
    return () => {
      document.body.classList.remove('header-dropdown-open');
    };
  }, [profileOpen, notifOpen]);

  React.useEffect(() => {
    let active = true;
    const loadDynamicNotifications = async () => {
      try {
        const submissions = await SubmissionService.getAllList();
        if (!active) return;

        const notifs: any[] = [];
        let idCounter = 1;

        submissions.forEach((sub) => {
          const subNo = sub.submissionNo || sub.id;
          const housingName = sub.housingName || 'Proyek';

          if (activeRole === 'Admin SIPAS') {
            if (sub.status === 'Pengajuan Dokumen') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Pengajuan Baru',
                desc: `Berkas ${housingName} (${subNo}) memerlukan verifikasi administrasi.`,
                type: 'info',
                time: sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString('id-ID') : 'Baru saja'
              });
            }
          } else if (activeRole === 'Tim Teknis') {
            if (sub.status === 'Verifikasi Administrasi') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Evaluasi Spasial',
                desc: `Berkas ${housingName} (${subNo}) lolos administrasi, siap verifikasi teknis/spasial.`,
                type: 'info',
                time: 'Perlu tinjauan'
              });
            }
          } else if (activeRole === 'Kepala Bidang') {
            if (sub.status === 'Menunggu Rekomendasi' || sub.status === 'Verifikasi Teknis') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Tinjauan Telaah Staf',
                desc: `Draf rekomendasi/evaluasi ${housingName} (${subNo}) siap ditinjau Kabid.`,
                type: 'warning',
                time: 'Mendesak'
              });
            }
          } else if (activeRole === 'Kadis') {
            if (sub.status === 'Proses TTE' || sub.status === 'Menunggu Persetujuan') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Antrean TTE Kadis',
                desc: `Draf SK ${housingName} (${subNo}) menunggu tanda tangan elektronik (TTE).`,
                type: 'warning',
                time: 'Butuh TTE'
              });
            }
          } else if (activeRole === 'Pemohon') {
            if (sub.status === 'Ditolak') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Catatan Revisi',
                desc: `Pengajuan ${housingName} (${subNo}) ditolak/butuh perbaikan berkas.`,
                type: 'warning',
                time: 'Penting'
              });
            } else if (sub.status === 'Disetujui') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Verifikasi Sukses',
                desc: `Selamat! SK Site Plan ${housingName} (${subNo}) telah disetujui & terbit.`,
                type: 'success',
                time: 'Selesai'
              });
            }
          } else if (activeRole === 'Super Admin') {
            if (sub.status === 'Pengajuan Dokumen') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Pengajuan Baru',
                desc: `Pemohon membuat pengajuan baru ${housingName} (${subNo}).`,
                type: 'info',
                time: 'Baru saja'
              });
            }
            if (sub.status === 'Ditolak') {
              notifs.push({
                id: `notif-${idCounter++}`,
                title: 'Pengajuan Ditolak',
                desc: `Ajuan ${housingName} (${subNo}) berstatus ditolak oleh petugas.`,
                type: 'warning',
                time: 'Log Sistem'
              });
            }
          }
        });

        if (notifs.length === 0) {
          notifs.push({
            id: 'notif-empty',
            title: 'Tidak Ada Tugas Aktif',
            desc: 'Kotak masuk Anda bersih. Tidak ada pengajuan yang membutuhkan tindakan Anda saat ini.',
            type: 'success',
            time: '-'
          });
        }

        setNotifications(notifs);
      } catch (err) {
        console.warn('Gagal memuat notifikasi dinamis:', err);
      }
    };

    loadDynamicNotifications();
    return () => {
      active = false;
    };
  }, [activeRole]);

  // Filter menu secara dinamis berdasarkan wewenang peran aktif.
  // KEBIJAKAN SOD: Tidak ada peran yang mendapat bypass universal — setiap item
  // menu HARUS mendaftarkan peran yang diizinkan secara eksplisit pada array `roles`-nya.
  const filteredMenu = menuItems.filter(item => {
    return item.roles.includes(activeRole);
  }).map(item => {
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter(sub => {
          return sub.roles.includes(activeRole);
        })
      };
    }
    return item;
  });

  // Dynamic notifications handled in state

  if (activeRole === 'Super Admin' && (location.pathname === '/dashboard' || location.pathname === '/')) {
    return <Navigate to="/master/pengguna" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans selection:bg-accent/30 select-none">
      {/* Sidebar Overlay (Mobile Screen Only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#111D13]/15 backdrop-blur-[1px] lg:hidden rounded-none"
          onClick={toggleSidebar}
        />
      )}

      {/* ─── KANVAS NAVIGASI (SIDEBAR) ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-border flex flex-col transition-all duration-300 transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0 w-64 lg:w-64' : '-translate-x-full w-64 lg:w-16'
          }`}
      >
        {/* Identitas Branding */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border bg-white shrink-0">
          <Link to="/" className="flex items-center space-x-2.5 mx-auto lg:mx-0">
            <div className="p-1.5 text-primary">
              <Layers className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className={`text-base font-bold tracking-tight text-primary transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              GEOSIPAS
            </span>
          </Link>
          {sidebarOpen && (
            <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Daftar Navigasi Menu */}
        <nav className={`flex-1 py-6 overflow-y-auto space-y-5 ${sidebarOpen ? 'px-3.5' : 'px-2'}`}>
          {filteredMenu.map((item, index) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isActive = location.pathname === item.path ||
              (hasSubmenu && item.submenu?.some(sub => location.pathname === sub.path));

            return (
              <div key={index} className="space-y-1">
                {hasSubmenu ? (
                  <>
                    <div className={`flex items-center px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      {item.title}
                    </div>
                    {item.submenu?.map((sub, sIndex) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sIndex}
                          to={sub.path}
                          title={!sidebarOpen ? sub.title : undefined}
                          className={`flex items-center rounded-none text-xs font-semibold transition-all group ${sidebarOpen ? 'px-4 py-2.5 pl-6' : 'px-0 py-2.5 justify-center'
                            } ${isSubActive
                              ? 'bg-secondary text-primary border-l-2 border-primary font-bold'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                          <sub.icon className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''} ${isSubActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`} />
                          {sidebarOpen && <span>{sub.title}</span>}
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link
                    to={item.path || '#'}
                    title={!sidebarOpen ? item.title : undefined}
                    className={`flex items-center rounded-none text-xs font-semibold transition-all group ${sidebarOpen ? 'px-4 py-2.5' : 'px-0 py-2.5 justify-center'
                      } ${isActive
                        ? 'bg-secondary text-primary border-l-2 border-primary font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <item.icon className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`} />
                    {sidebarOpen && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profil Sesi Pengguna di Kaki Sidebar */}
        <div className="p-4 border-t border-border bg-slate-50/50 text-slate-500 text-xs shrink-0 select-none">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-white">
                {activeRole.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-slate-800 truncate text-[11px] leading-tight">{userProfile.name}</p>
                <p className="text-slate-400 truncate text-[9px] leading-none mt-1 uppercase tracking-wider font-bold">{activeRole}</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white" title={`${userProfile.name} (${activeRole})`}>
              {activeRole.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </aside>

      {/* ─── KANVAS UTAMA (CONTENT VIEWPORT) ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">

        {/* Bilah Navigasi Atas (Header) */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.015)] shrink-0 select-none">
          {/* Hamburger toggle */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ml-1.5 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer outline-none border-none"
            title="Sembunyikan/Tampilkan Navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Sisi Kanan: Simulasi Role, Notifikasi, & Profil Dropdown */}
          <div className="flex items-center space-x-3.5">



            {/* Panel Notifikasi */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all relative cursor-pointer outline-none border-none bg-transparent"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && notifications[0]?.id !== 'notif-empty' && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-none shadow-xl border border-border z-20 overflow-hidden text-left">
                    <div className="p-3.5 border-b border-border flex justify-between items-center bg-slate-50">
                      <span className="font-bold text-xs text-slate-700">Notifikasi Masuk</span>
                      <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline uppercase tracking-wider">Tandai Dibaca</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors flex space-x-3">
                          {n.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                          ) : n.type === 'warning' ? (
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-slate-800">{n.title}</h5>
                            <p className="text-slate-500 text-[10px] leading-tight mt-0.5 truncate">{n.desc}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Menu Pengguna */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2.5 focus:outline-none border-none bg-transparent cursor-pointer"
              >
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="h-8 w-8 rounded-full object-cover border-2 border-border shadow-sm shrink-0"
                />
                <div className="hidden md:block text-left select-none leading-none">
                  <div className="text-xs font-bold text-slate-800 max-w-[130px] truncate">
                    {userProfile.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                    {activeRole}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-none shadow-xl border border-border z-20 overflow-hidden py-1 text-left">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-bold text-xs text-slate-800">{userProfile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{userProfile.email}</p>
                    </div>
                    <Link
                      to="/profil"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors rounded-none"
                    >
                      <User className="h-4 w-4 mr-3 text-slate-400" />
                      Profil Saya
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs text-rose-600 hover:bg-[#ef4444]/5 transition-colors text-left rounded-none border-none bg-transparent font-bold cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-3 text-rose-500" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Area Render Konten Utama Halaman (Outlet) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 bg-background">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}