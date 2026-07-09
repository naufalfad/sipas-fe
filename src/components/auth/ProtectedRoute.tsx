import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';
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
export const normalizeRole = (role: string): string => {
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
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk mengakses halaman ini.');
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

  if (!isAuthenticated) {
    // Redirect to login page and keep track of where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
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