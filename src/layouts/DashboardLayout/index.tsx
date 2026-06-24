import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import type { UserRole } from '@/app/store/useUIStore';
import {
  LayoutDashboard, ClipboardList, Layers, ShieldCheck,
  Map, FileBarChart2, Database, Users, ShieldAlert,
  Bookmark, Menu, X, Bell, User, LogOut, ChevronDown,
  AlertCircle, CheckCircle, FileText
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
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'],
  },
  {
    title: 'Pengajuan Site Plan',
    icon: ClipboardList,
    roles: ['Pemohon', 'Admin SIPAS', 'Super Admin'],
    submenu: [
      {
        title: 'Daftar Pengajuan',
        path: '/pengajuan/daftar',
        icon: ClipboardList,
        roles: ['Pemohon', 'Admin SIPAS', 'Super Admin'],
      },
      {
        title: 'Pengajuan Baru',
        path: '/pengajuan/tambah',
        icon: FileText,
        roles: ['Pemohon', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Site Plan',
    icon: Layers,
    roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'],
    submenu: [
      {
        title: 'Daftar Site Plan',
        path: '/siteplan/daftar',
        icon: Layers,
        roles: ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'],
      },
    ],
  },
  {
    title: 'Verifikasi',
    path: '/verifikasi',
    icon: ShieldAlert,
    roles: ['Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'],
  },
  {
    title: 'GIS Viewer',
    path: '/gis',
    icon: Map,
    roles: ['Pemohon', 'Tim Teknis', 'Super Admin'],
  },
  {
    title: 'Laporan',
    path: '/laporan',
    icon: FileBarChart2,
    roles: ['Admin SIPAS', 'Kepala Bidang', 'Super Admin'],
  },
  {
    title: 'Master Data',
    icon: Database,
    roles: ['Admin SIPAS', 'Super Admin'],
    submenu: [
      {
        title: 'User',
        path: '/master/pengguna',
        icon: Users,
        roles: ['Admin SIPAS', 'Super Admin'],
      },
      {
        title: 'Role',
        path: '/master/role',
        icon: ShieldCheck,
        roles: ['Admin SIPAS', 'Super Admin'],
      },
      {
        title: 'Referensi',
        path: '/master/referensi',
        icon: Bookmark,
        roles: ['Admin SIPAS', 'Super Admin'],
      },
    ],
  },
];

export default function DashboardLayout() {
  const { sidebarOpen, activeRole, userProfile, toggleSidebar, setActiveRole } = useUIStore();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Filter menus based on active role
  const filteredMenu = menuItems.filter(item => {
    if (activeRole === 'Super Admin') return true;
    return item.roles.includes(activeRole);
  }).map(item => {
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter(sub => {
          if (activeRole === 'Super Admin') return true;
          return sub.roles.includes(activeRole);
        })
      };
    }
    return item;
  });

  const rolesList: UserRole[] = ['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Super Admin'];

  const mockNotifs = [
    { id: 1, title: 'Pengajuan Baru', desc: 'Berkas SIPAS-2026-001 butuh verifikasi.', type: 'info', time: '10 menit yang lalu' },
    { id: 2, title: 'Verifikasi Sukses', desc: 'Administrasi SIPAS-2026-003 disetujui.', type: 'success', time: '1 jam yang lalu' },
    { id: 3, title: 'Catatan Revisi', desc: 'SIPAS-2026-005 dikembalikan ke Developer.', type: 'warning', time: '1 hari yang lalu' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-200">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? '-translate-x-full' : 'translate-x-0'
          }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-600 rounded-lg text-white">
              <Layers className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-wider text-teal-400">GEOSIPAS</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {filteredMenu.map((item, index) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isActive = location.pathname === item.path ||
              (hasSubmenu && item.submenu?.some(sub => location.pathname === sub.path));

            return (
              <div key={index} className="space-y-1">
                {hasSubmenu ? (
                  <>
                    <div className="flex items-center px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {item.title}
                    </div>
                    {item.submenu?.map((sub, sIndex) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sIndex}
                          to={sub.path}
                          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${isSubActive
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                          <sub.icon className={`mr-3 h-5 w-5 ${isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          {sub.title}
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link
                    to={item.path || '#'}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {item.title}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Role Badge Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-slate-400 text-xs text-center">
          Active Role: <span className="font-semibold text-teal-400">{activeRole}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-10 shadow-sm">
          {/* Hamburger toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Right actions */}
          <div className="flex items-center space-x-4">

            {/* Demo Role Switcher Widget */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
              >
                <span>Role: {activeRole}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {roleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                      Switch Active Role
                    </div>
                    {rolesList.map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setActiveRole(role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors block ${activeRole === role ? 'font-bold text-teal-600 dark:text-teal-400' : ''
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full"></span>
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                    <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-bold text-sm">Notifikasi</span>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold cursor-pointer">Tandai semua dibaca</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                      {mockNotifs.map(n => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex space-x-3">
                          {n.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                          ) : n.type === 'warning' ? (
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-teal-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-semibold text-xs">{n.title}</h5>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{n.desc}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="h-9 w-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold leading-tight text-slate-800 dark:text-white max-w-[150px] truncate">
                    {userProfile.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeRole}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{userProfile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile.email}</p>
                    </div>
                    <Link
                      to="/profil"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3 text-slate-400" />
                      Profil Saya
                    </Link>
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
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

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
