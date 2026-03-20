import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import UserPage from '@/modules/user/pages/UserPage';
import { DashboardPage } from '@/modules/dashboard';
import { PanelPage } from '@/modules/panel';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'user',
        element: <UserPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'panel/:panelId',
        element: <PanelPage />,
      },
    ],
  },
]);

export default router;
