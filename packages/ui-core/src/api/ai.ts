import { ApiClient } from "./client.js";
import { RequestOptions } from "#pkg/seedar/types";
import {
  AiResponse,
  CreateAiRequest,
  UpdateAiRequest,
  AiSessionResponse,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
  AiChatRequestDto,
  AiStreamChunk,
  PaginatedResult,
} from "#pkg/seedar/types";

export class AiApi {
  static async create(
    data: CreateAiRequest,
    options?: RequestOptions,
  ): Promise<AiResponse> {
    return ApiClient.post<AiResponse>("/v1/ai", data, options);
  }

  static async findAll(
    page?: number,
    pageSize?: number,
    options?: RequestOptions,
  ): Promise<PaginatedResult<AiResponse>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    return ApiClient.get<PaginatedResult<AiResponse>>("/v1/ai", {
      ...options,
      params: { ...options?.params, ...params },
    });
  }

  static async findOne(
    id: string,
    options?: RequestOptions,
  ): Promise<AiResponse> {
    return ApiClient.get<AiResponse>(`/v1/ai/${id}`, options);
  }

  static async update(
    data: UpdateAiRequest,
    options?: RequestOptions,
  ): Promise<AiResponse> {
    return ApiClient.patch<AiResponse>("/v1/ai", data, options);
  }

  static async remove(id: string, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/v1/ai/${id}`, options);
  }

  static async createSession(
    data: CreateAiSessionRequest,
    options?: RequestOptions,
  ): Promise<AiSessionResponse> {
    return ApiClient.post<AiSessionResponse>("/v1/ai/session", data, options);
  }

  static async findSession(
    id: string,
    options?: RequestOptions,
  ): Promise<AiSessionResponse> {
    return ApiClient.get<AiSessionResponse>(`/v1/ai/session/${id}`, options);
  }

  static async updateSession(
    data: UpdateAiSessionRequest,
    options?: RequestOptions,
  ): Promise<AiSessionResponse> {
    return ApiClient.patch<AiSessionResponse>("/v1/ai/session", data, options);
  }

  static streamChat(
    dto: AiChatRequestDto,
    callbacks: {
      onSession?: (data: { sessionId: string; timestamp: string }) => void;
      onMessage?: (chunk: AiStreamChunk) => void;
      onDone?: (data: { sessionId: string }) => void;
      onError?: (error: string) => void;
      onPing?: () => void;
    },
  ): { close: () => void } {
    const controller = new AbortController();
    const { signal } = controller;

    const baseUrl = (() => {
      const config = (globalThis as any).__API_CONFIG__;
      return config?.baseURL || "";
    })();

    const url = `${baseUrl}/v1/ai/chat/stream`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.text();
          callbacks.onError?.(`Request failed: ${error}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          callbacks.onError?.("Response body is not readable");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        const read = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || !line.startsWith("data:")) continue;

              try {
                const data = line.slice(5).trim();
                if (!data) continue;

                const event = JSON.parse(data) as {
                  type: string;
                  data: string;
                };

                switch (event.type) {
                  case "ping":
                    callbacks.onPing?.();
                    break;
                  case "session":
                    callbacks.onSession?.(JSON.parse(event.data));
                    break;
                  case "message":
                    callbacks.onMessage?.({
                      ...JSON.parse(event.data),
                      done: false,
                    });
                    break;
                  case "done":
                    callbacks.onDone?.(JSON.parse(event.data));
                    break;
                  case "error":
                    callbacks.onError?.(event.data);
                    break;
                }
              } catch (e) {
                console.error("Failed to parse SSE message:", e);
              }
            }

            read();
          });
        };

        read();
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          callbacks.onError?.(error.message);
        }
      });

    return {
      close: () => controller.abort(),
    };
  }
}
