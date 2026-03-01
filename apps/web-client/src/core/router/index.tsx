import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import UserPage from '@/modules/user/pages/UserPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/user" replace />,
      },
      {
        path: 'user',
        element: <UserPage />,
      },
    ],
  },
]);

export default router;
