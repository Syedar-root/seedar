import {
  useQuery as useReactQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useDashboardApi } from './useApi';
import type {
  DashboardResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  Layouts,
} from '#pkg/seedar/types';

const dashboardKeys = {
  all: ['dashboards'] as const,
  lists: () => [...dashboardKeys.all, 'list'] as const,
  details: () => [...dashboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...dashboardKeys.details(), id] as const,
};

export const useDashboards = () => {
  const dashboardApi = useDashboardApi();

  return useReactQuery({
    queryKey: dashboardKeys.lists(),
    queryFn: () => dashboardApi.findAll(),
  });
};

export const useDashboard = (id: string) => {
  const dashboardApi = useDashboardApi();

  return useReactQuery({
    queryKey: dashboardKeys.detail(id),
    queryFn: () => dashboardApi.findOne(id),
    enabled: !!id,
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: (data: CreateDashboardRequest) => dashboardApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
    },
  });
};

export const useUpdateDashboard = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDashboardRequest }) =>
      dashboardApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteDashboard = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: (id: string) => dashboardApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
    },
  });
};

export const useUpdateLayout = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: ({ id, layout }: { id: string; layout: Layouts }) =>
      dashboardApi.updateLayout(id, layout),
    onSuccess: (_, variables) => {
      // queryClient.invalidateQueries({
      //   queryKey: dashboardKeys.detail(variables.id),
      // });
    },
  });
};

export const useAddPanel = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: ({ id, panelId }: { id: string; panelId: string }) =>
      dashboardApi.addPanel(id, panelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(variables.id),
      });
    },
  });
};

export const useRemovePanel = () => {
  const queryClient = useQueryClient();
  const dashboardApi = useDashboardApi();

  return useMutation({
    mutationFn: ({ id, panelId }: { id: string; panelId: string }) =>
      dashboardApi.removePanel(id, panelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(variables.id),
      });
    },
  });
};
