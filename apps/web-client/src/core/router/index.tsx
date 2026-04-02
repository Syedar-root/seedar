import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import UserPage from "@/modules/user/pages/UserPage";
import { DashboardPage } from "@/modules/dashboard";
import { PanelPage } from "@/modules/panel";
import { DatasourcePage } from "@/modules/datasource";
import { DatasourceDetailPage } from "@/modules/datasource";
import {
  DatasetPage,
  DatasetDetailPage,
  DatasetCreatePage,
  DatasetEditPage,
} from "@/modules/dataset/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "user",
        element: <UserPage />,
      },
      {
        path: "dataset",
        element: <DatasetPage />,
      },
      {
        path: "dataset/create",
        element: <DatasetCreatePage />,
      },
      {
        path: "dataset/:id",
        element: <DatasetDetailPage />,
      },
      {
        path: "dataset/:id/edit",
        element: <DatasetEditPage />,
      },
      {
        path: "dashboard/:dashboardId?",
        element: <DashboardPage />,
      },
      {
        path: "panel",
        element: <PanelPage />,
      },
      {
        path: "panel/:panelId",
        element: <PanelPage />,
      },
      {
        path: "datasource",
        element: <DatasourcePage />,
      },
      {
        path: "datasource/:id",
        element: <DatasourceDetailPage />,
      },
    ],
  },
]);

export default router;