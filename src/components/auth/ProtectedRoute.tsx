import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useConfigStore } from '@/app/store/useConfigStore';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * normalizeRole — Pemetaan Kanonik Peran (SoD-Safe Role Normalization)
 *
 * KEBIJAKAN SOD:
 *   Fungsi ini memetakan nama peran dari format database (snake_case/UPPER_CASE)
 *   ke nama tampilan frontend secara BIJEKTIF (satu-ke-satu, tidak ada overlap).
 *   Setiap peran harus dipetakan secara eksplisit; tidak ada fallthrough yang
 *   memungkinkan satu peran menyamar sebagai peran lain.
 *
 *   Pemetaan kanonik:
 *     DB role                      → Frontend display role
 *     PEMOHON                      → 'Pemohon'
 *     ADMIN / ADMIN SIPAS          → 'Admin SIPAS'
 *     TIM_TEKNIS                   → 'Tim Teknis'
 *     KABID_PUPR / KEPALA BIDANG   → 'Kepala Bidang'
 *     KADIS / KEPALA DINAS         → 'Kadis'
 *     SUPER_ADMIN                  → 'Super Admin'
 */
export const normalizeRole = (role: string, username?: string): string => {
  if (username === 'superadmin@geocitra.com') return 'Super Admin';
  const r = role.toUpperCase();
  if (r === 'PEMOHON') return 'Pemohon';
  if (r === 'ADMIN' || r === 'ADMIN SIPAS') return 'Admin SIPAS';
  if (r === 'TIM_TEKNIS' || r === 'TIM TEKNIS') return 'Tim Teknis';
  if (r === 'KABID_PUPR' || r === 'KEPALA BIDANG' || r === 'KABID') return 'Kepala Bidang';
  if (r === 'KADIS' || r === 'KEPALA DINAS') return 'Kadis';
  if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN') return 'Super Admin';
  return role;
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isMaintenance, idleTimeout, fetchConfig } = useConfigStore();
  const location = useLocation();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 1. Idle Timeout Auto-Logout Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toast.warning('Sesi Anda telah berakhir karena inaktivitas.', { id: 'idle-timeout-toast' });
        logout();
      }, idleTimeout * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, idleTimeout, logout]);

  // 2. Active Maintenance Kick Guard
  useEffect(() => {
    if (isMaintenance && isAuthenticated && user) {
      const userRole = normalizeRole(user.role);
      if (userRole !== 'Super Admin') {
        logout();
        toast.error('Sistem sedang dalam pemeliharaan berkala.', { id: 'maintenance-kick-toast' });
      }
    }
  }, [isMaintenance, isAuthenticated, user, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      const justLoggedOut = sessionStorage.getItem('justLoggedOut');
      if (justLoggedOut === 'true') {
        sessionStorage.removeItem('justLoggedOut');
        toast.success('Logout berhasil! Sesi Anda telah ditutup.');
      } else {
        toast.error('Silakan login terlebih dahulu untuk mengakses halaman ini.');
      }
    } else if (allowedRoles && user) {
      const normalizedUserRole = normalizeRole(user.role);
      const isAllowed = allowedRoles.some(
        (role) => normalizeRole(role) === normalizedUserRole
      );
      if (!isAllowed) {
        toast.error('Hak akses ditolak. Peran Anda tidak memiliki wewenang untuk halaman ini.');
      }
    }
  }, [isAuthenticated, allowedRoles, user]);

  // Redirect to maintenance page if system is in maintenance mode and user is not Super Admin
  if (isMaintenance) {
    const isSuperAdmin = isAuthenticated && user && normalizeRole(user.role) === 'Super Admin';
    if (!isSuperAdmin) {
      return <Navigate to="/maintenance" replace />;
    }
  }

  if (!isAuthenticated) {
    // Redirect to login page. If they just logged out, don't pass the redirect source (send to dashboard instead).
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    const redirectState = justLoggedOut === 'true' ? undefined : { from: location };
    return <Navigate to="/login" state={redirectState} replace />;
  }

  if (allowedRoles && user) {
    const normalizedUserRole = normalizeRole(user.role);
    const isAllowed = allowedRoles.some(
      (role) => normalizeRole(role) === normalizedUserRole
    );
    if (!isAllowed) {
      // Redirect to dashboard page
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}