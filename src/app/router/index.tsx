import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';

// Page Imports
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import SubmissionListPage from '@/features/submission/pages/SubmissionListPage';
import SubmissionCreatePage from '@/features/submission/pages/SubmissionCreatePage';
import SubmissionDetailPage from '@/features/submission/pages/SubmissionDetailPage';
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

/**
 * KONFIGURASI ROUTER UTAMA (GEOSIPAS)
 * 
 * Sesuai prinsip Low Coupling & High Cohesion, rute dipisahkan menjadi dua kelompok utama:
 * 1. Kelompok Administratif (Dibalut oleh DashboardLayout):
 *    Menyajikan halaman tabular, form administratif, laporan, dan pengelolaan data master.
 * 2. Kelompok Spasial Imersif (GIS Page berdiri sendiri):
 *    Diletakkan di tingkat teratas agar komponen peta dapat mengonsumsi 100% ruang
 *    viewport peramban tanpa terhalang atau terpotong oleh layout pembungkus dashboard.
 */
export const router = createBrowserRouter([
  // 1. KELOMPOK ADMINISTRATIF (Dashboard & Dokumen)
  {
    path: '/',
    element: <DashboardLayout />,
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
            element: <SubmissionCreatePage />,
          },
          {
            path: 'detail/:id',
            element: <SubmissionDetailPage />,
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
        element: <VerificationPage />,
      },
      {
        path: 'persetujuan',
        element: <ApprovalQueuePage />,
      },
      {
        path: 'profil',
        element: <ProfilePage />,
      },
      {
        path: 'laporan',
        element: <ReportsPage />,
      },
      {
        path: 'master',
        children: [
          {
            path: 'pengguna',
            element: <UsersPage />,
          },
          {
            path: 'role',
            element: <RolesPage />,
          },
          {
            path: 'referensi',
            element: <ReferencesPage />,
          },
        ],
      },
    ],
  },

  // 2. KELOMPOK SPASIAL (Immersive Infinite Canvas)
  // Dilepas dari anak DashboardLayout agar peta bebas mengonsumsi seluruh resolusi layar monitor.
  {
    path: '/gis',
    element: <GISPage />,
  },
  {
    path: '/gis/bim/:id',
    element: <BimViewerPage />,
  },

  // 3. FALLBACK REDIRECT (Fail-Safe Routing)
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);