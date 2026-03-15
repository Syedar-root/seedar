import {
  useQuery as useReactQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { usePanelApi } from './useApi';
import type {
  PanelResponse,
  CreatePanelRequest,
  UpdatePanelRequest,
} from '#pkg/seedar/types';

const panelKeys = {
  all: ['panels'] as const,
  lists: () => [...panelKeys.all, 'list'] as const,
  details: () => [...panelKeys.all, 'detail'] as const,
  detail: (id: string) => [...panelKeys.details(), id] as const,
};

export const usePanels = () => {
  const panelApi = usePanelApi();

  return useReactQuery({
    queryKey: panelKeys.lists(),
    queryFn: () => panelApi.findAll(),
  });
};

export const usePanel = (id: string, enabled: boolean = true) => {
  const panelApi = usePanelApi();

  return useReactQuery({
    queryKey: panelKeys.detail(id),
    queryFn: () => panelApi.findOne(id),
    enabled: !!id && enabled,
  });
};

export const useCreatePanel = () => {
  const queryClient = useQueryClient();
  const panelApi = usePanelApi();

  return useMutation({
    mutationFn: (data: CreatePanelRequest) => panelApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: panelKeys.lists() });
    },
  });
};

export const useUpdatePanel = () => {
  const queryClient = useQueryClient();
  const panelApi = usePanelApi();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePanelRequest }) =>
      panelApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: panelKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: panelKeys.detail(variables.id),
      });
    },
  });
};

export const useDeletePanel = () => {
  const queryClient = useQueryClient();
  const panelApi = usePanelApi();

  return useMutation({
    mutationFn: (id: string) => panelApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: panelKeys.lists() });
    },
  });
};
