import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';

// Component & Page Imports
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import SubmissionListPage from '@/features/submission/pages/SubmissionListPage';
import SubmissionCreatePage from '@/features/submission/pages/SubmissionCreatePage';
import SubmissionDetailPage from '@/features/submission/pages/SubmissionDetailPage';
import SubmissionVerificationPage from '@/features/submission/pages/SubmissionVerificationPage';
import SubmissionPreviewTelaahPage from '@/features/submission/pages/SubmissionPreviewTelaahPage'; // Halaman Baru (Fase 2)
import SitePlanListPage from '@/features/siteplan/pages/SitePlanListPage';
import SitePlanDetailPage from '@/features/siteplan/pages/SitePlanDetailPage';
import VerificationPage from '@/features/verification/pages/VerificationPage';
import GISPage from '@/features/gis/pages/GISPage';
import BimViewerPage from '@/features/gis/pages/BimViewerPage';
import ReportsPage from '@/features/approval/pages/ReportsPage';
import ApprovalQueuePage from '@/features/approval/pages/ApprovalQueuePage';
import UsersPage from '@/features/users/pages/UsersPage';
import RolesPage from '@/features/users/pages/RolesPage';
import ReferencesPage from '@/features/users/pages/ReferencesPage';
import ProfilePage from '@/features/users/pages/ProfilePage';

// Auth Pages & Route Guard
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * KONFIGURASI ROUTER UTAMA (GEOSIPAS)
 * 
 * Sesuai prinsip Low Coupling & High Cohesion, rute dipisahkan menjadi kelompok:
 * 1. Public Routes: Login dan Register (tidak dilindungi)
 * 2. Kelompok Administratif (Dibalut oleh DashboardLayout & ProtectedRoute):
 *    Menyajikan halaman tabular, form administratif, laporan, dan pengelolaan data master.
 * 3. Kelompok Spasial Imersif (GIS Page dilindungi Route Guard):
 *    Diletakkan di tingkat teratas agar komponen peta dapat mengonsumsi 100% ruang
 *    viewport peramban.
 */
export const router = createBrowserRouter([
  // 1. PUBLIC ROUTES
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // 2. KELOMPOK ADMINISTRATIF (Dashboard & Dokumen - Terlindungi)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'pengajuan',
        children: [
          {
            index: true,
            element: <Navigate to="daftar" replace />,
          },
          {
            path: 'daftar',
            element: <SubmissionListPage />,
          },
          {
            path: 'tambah',
            element: (
              <ProtectedRoute allowedRoles={['Pemohon', 'Super Admin']}>
                <SubmissionCreatePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <ProtectedRoute allowedRoles={['Pemohon', 'Super Admin']}>
                <SubmissionCreatePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'detail/:id',
            element: <SubmissionDetailPage />,
          },
          {
            path: 'verifikasi/:id',
            element: (
              <ProtectedRoute allowedRoles={['Tim Teknis', 'Kepala Bidang', 'Super Admin']}>
                <SubmissionVerificationPage />
              </ProtectedRoute>
            ),
          },
          // ─── BARU: HALAMAN PREVIEW & SUBMIT TELAAH STAF (Fase 2) ───
          {
            path: 'verifikasi/:id/preview-telaah',
            element: (
              <ProtectedRoute allowedRoles={['Tim Teknis', 'Super Admin']}>
                <SubmissionPreviewTelaahPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'siteplan',
        children: [
          {
            index: true,
            element: <Navigate to="daftar" replace />,
          },
          {
            path: 'daftar',
            element: <SitePlanListPage />,
          },
          {
            path: 'detail/:id',
            element: <SitePlanDetailPage />,
          },
        ],
      },
      {
        path: 'verifikasi',
        element: (
          // SOD: Super Admin dikecualikan. Hanya pejabat fungsional yang berwenang
          // melakukan verifikasi administrasi, teknis, dan persetujuan TTE.
          <ProtectedRoute allowedRoles={['Admin SIPAS', 'Tim Teknis', 'Kepala Bidang']}>
            <VerificationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'persetujuan',
        element: (
          // SOD: Pembubuhan TTE adalah kewenangan eksklusif Kepala Dinas (Kadis).
          // Tidak ada peran lain, termasuk Super Admin, yang dapat mengakses rute ini.
          <ProtectedRoute allowedRoles={['Kadis']}>
            <ApprovalQueuePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profil',
        element: <ProfilePage />,
      },
      {
        path: 'laporan',
        element: (
          <ProtectedRoute allowedRoles={['Admin SIPAS', 'Kepala Bidang', 'Super Admin']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'master',
        children: [
          {
            path: 'pengguna',
            element: (
              // SOD: Master Data adalah domain eksklusif Super Admin.
              // Admin SIPAS mengelola verifikasi, bukan konfigurasi sistem pengguna & role.
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <UsersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'role',
            element: (
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <RolesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'referensi',
            element: (
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <ReferencesPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },

  // 3. KELOMPOK SPASIAL (Immersive Infinite Canvas - Terlindungi)
  {
    path: '/gis',
    element: (
      <ProtectedRoute allowedRoles={['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis', 'Super Admin']}>
        <GISPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gis/bim/:id',
    element: (
      <ProtectedRoute allowedRoles={['Pemohon', 'Admin SIPAS', 'Tim Teknis', 'Kepala Bidang', 'Kadis', 'Super Admin']}>
        <BimViewerPage />
      </ProtectedRoute>
    ),
  },

  // 4. FALLBACK REDIRECT (Fail-Safe Routing)
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);