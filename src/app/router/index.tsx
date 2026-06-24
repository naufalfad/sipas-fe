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
import ReportsPage from '@/features/approval/pages/ReportsPage';
import UsersPage from '@/features/users/pages/UsersPage';
import RolesPage from '@/features/users/pages/RolesPage';
import ReferencesPage from '@/features/users/pages/ReferencesPage';

export const router = createBrowserRouter([
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
        path: 'gis',
        element: <GISPage />,
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
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
