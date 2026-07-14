// --- FILE: src/app/router/index.tsx ---
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';

// Component & Page Imports
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import SubmissionListPage from '@/features/submission/pages/SubmissionListPage';
import SubmissionCreatePage from '@/features/submission/pages/SubmissionCreatePage';
import SubmissionDetailPage from '@/features/submission/pages/SubmissionDetailPage';
import SubmissionVerificationPage from '@/features/submission/pages/SubmissionVerificationPage';
import SubmissionPreviewTelaahPage from '@/features/submission/pages/SubmissionPreviewTelaahPage'; // Halaman (Fase 2)
import SubmissionKabidReviewPage from '@/features/submission/pages/SubmissionKabidReviewPage';       // BARU TAHAP 2 (Kabid)
import SubmissionKadisSignPage from '@/features/submission/pages/SubmissionKadisSignPage';         // BARU TAHAP 2 (Kadis)
import SubmissionReceiptPage from '@/features/submission/pages/SubmissionReceiptPage';
import SitePlanListPage from '@/features/siteplan/pages/SitePlanListPage';
import SitePlanDetailPage from '@/features/siteplan/pages/SitePlanDetailPage';
import VerificationPage from '@/features/verification/pages/VerificationPage';
import GISPage from '@/features/gis/pages/GISPage';

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
import MaintenancePage from '@/features/auth/pages/MaintenancePage';
import KaryawanPage from '@/features/users/pages/KaryawanPage';
import ConfigPage from '@/features/users/pages/ConfigPage';
import ActivityLogPage from '@/features/users/pages/ActivityLogPage';
import FeedbackPage from '@/features/users/pages/FeedbackPage';

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
  {
    path: '/maintenance',
    element: <MaintenancePage />,
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
            path: 'penerimaan/:id',
            element: (
              <ProtectedRoute allowedRoles={['Pemohon', 'Super Admin']}>
                <SubmissionReceiptPage />
              </ProtectedRoute>
            ),
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
              // REVISI: Pembatasan ketat fungsional SoD. Kabid dilarang keras memproses lembar input verifikasi teknis.
              <ProtectedRoute allowedRoles={['Tim Teknis', 'Super Admin']}>
                <SubmissionVerificationPage />
              </ProtectedRoute>
            ),
          },
          // ─── HALAMAN PREVIEW & SUBMIT TELAAH STAF (Fase 2) ───
          {
            path: 'verifikasi/:id/preview-telaah',
            element: (
              <ProtectedRoute allowedRoles={['Tim Teknis', 'Super Admin']}>
                <SubmissionPreviewTelaahPage />
              </ProtectedRoute>
            ),
          },
          // ─── BARU TAHAP 2: HALAMAN TINJAUAN & PARAFI DRAF SK OLEH KABID (SO-D GATEWAY) ───
          {
            path: 'verifikasi/:id/tinjau-kabid',
            element: (
              <ProtectedRoute allowedRoles={['Kepala Bidang', 'Super Admin']}>
                <SubmissionKabidReviewPage />
              </ProtectedRoute>
            ),
          },
          // ─── BARU TAHAP 2: HALAMAN PERSIDANGAN TTE SK FINAL OLEH KEPALA DINAS (KADIS SECURE TTE) ───
          {
            path: 'verifikasi/:id/sahkan-kadis',
            element: (
              <ProtectedRoute allowedRoles={['Kadis', 'Super Admin']}>
                <SubmissionKadisSignPage />
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
          // SOD REVISI: Kabid diarahkan langsung ke Detail Page dan tidak menggunakan antrean input evaluasi.
          // Hanya menyisakan Admin SIPAS (administrasi) dan Tim Teknis (koordinat/spasial).
          <ProtectedRoute allowedRoles={['Admin SIPAS', 'Tim Teknis']}>
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
        path: 'usulan',
        element: <FeedbackPage />,
      },
      {
        path: 'laporan',
        element: (
          <ProtectedRoute allowedRoles={['Admin SIPAS', 'Kepala Bidang', 'Super Admin', 'Kadis']}>
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
          {
            path: 'karyawan',
            element: (
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <KaryawanPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'konfigurasi',
            element: (
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <ConfigPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'log-aktivitas',
            element: (
              <ProtectedRoute allowedRoles={['Super Admin']}>
                <ActivityLogPage />
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


  // 4. FALLBACK REDIRECT (Fail-Safe Routing)
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);