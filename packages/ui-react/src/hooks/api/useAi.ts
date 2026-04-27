import {
  useQuery as useReactQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAiApi } from './useApi';
import type {
  AiResponse,
  CreateAiRequest,
  UpdateAiRequest,
  AiSessionResponse,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
  AiChatRequestDto,
  AiAgentStreamChunk,
  PaginatedResult,
  GenerateFieldBusinessNameRequest,
} from '#pkg/seedar/types';

const aiKeys = {
  all: ['ai'] as const,
  lists: () => [...aiKeys.all, 'list'] as const,
  details: () => [...aiKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiKeys.details(), id] as const,
  sessions: () => [...aiKeys.all, 'session'] as const,
  sessionDetail: (id: string) => [...aiKeys.sessions(), id] as const,
};

export const useAis = (page?: number, pageSize?: number) => {
  const aiApi = useAiApi();

  return useReactQuery({
    queryKey: [...aiKeys.lists(), page, pageSize],
    queryFn: () => aiApi.findAll(page, pageSize),
  });
};

export const useAi = (id: string) => {
  const aiApi = useAiApi();

  return useReactQuery({
    queryKey: aiKeys.detail(id),
    queryFn: () => aiApi.findOne(id),
    enabled: !!id,
  });
};

export const useCreateAi = () => {
  const queryClient = useQueryClient();
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (data: CreateAiRequest) => aiApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.lists() });
    },
  });
};

export const useUpdateAi = () => {
  const queryClient = useQueryClient();
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (data: UpdateAiRequest) => aiApi.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: aiKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteAi = () => {
  const queryClient = useQueryClient();
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (id: string) => aiApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.lists() });
    },
  });
};

export const useAiSession = (id: string) => {
  const aiApi = useAiApi();

  return useReactQuery({
    queryKey: aiKeys.sessionDetail(id),
    queryFn: () => aiApi.findSession(id),
    enabled: !!id,
  });
};

export const useCreateAiSession = () => {
  const queryClient = useQueryClient();
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (data: CreateAiSessionRequest) => aiApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
    },
  });
};

export const useUpdateAiSession = () => {
  const queryClient = useQueryClient();
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (data: UpdateAiSessionRequest) => aiApi.updateSession(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.sessionDetail(variables.id),
      });
    },
  });
};

export const useAiChat = () => {
  const aiApi = useAiApi();

  const streamChat = (
    dto: AiChatRequestDto,
    callbacks: {
      onSession?: (data: { sessionId: string; timestamp: string }) => void;
      onMessage?: (chunk: AiAgentStreamChunk) => void;
      onDone?: (data: { sessionId: string }) => void;
      onError?: (error: string) => void;
      onPing?: () => void;
    }
  ) => {
    return aiApi.streamChat(dto, callbacks);
  };

  return {
    streamChat,
  };
};

export const useGenerateFieldBusinessNames = () => {
  const aiApi = useAiApi();

  return useMutation({
    mutationFn: (data: GenerateFieldBusinessNameRequest) =>
      aiApi.generateFieldBusinessNames(data),
  });
};
