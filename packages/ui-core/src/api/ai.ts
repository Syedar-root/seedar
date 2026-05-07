import { ApiClient } from "./client.js";
import { RequestOptions } from "#pkg/seedar/types";
import {
  AiResponse,
  CreateAiRequest,
  UpdateAiRequest,
  AiSessionResponse,
  AiSessionStatus,
  AiSessionType,
  AiSessionMessageResponse,
  CursorPaginatedResponse,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
  AiChatRequestDto,
  AiAgentStreamChunk,
  AiContextStatusEvent,
  PaginatedResult,
  GenerateFieldBusinessNameRequest,
  GenerateFieldBusinessNameResponse,
} from "#pkg/seedar/types";

export interface AiDoneEventData {
  sessionId: string;
  isOver?: boolean;
}

export interface AiSessionTitleEventData {
  sessionId: string;
  title: string;
}

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

  static async findSessions(
    page?: number,
    pageSize?: number,
    status?: AiSessionStatus,
    type?: AiSessionType,
    options?: RequestOptions,
  ): Promise<PaginatedResult<AiSessionResponse>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (status !== undefined) params.status = status;
    if (type !== undefined) params.type = type;
    return ApiClient.get<PaginatedResult<AiSessionResponse>>("/v1/ai/session", {
      ...options,
      params: { ...options?.params, ...params },
    });
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

  static async deleteSession(
    id: string,
    options?: RequestOptions,
  ): Promise<void> {
    return ApiClient.delete<void>(`/v1/ai/session/${id}`, options);
  }

  static async listSessionMessages(
    id: string,
    cursor?: string,
    limit: number = 50,
    options?: RequestOptions,
  ): Promise<CursorPaginatedResponse<AiSessionMessageResponse>> {
    const params: Record<string, any> = { limit };
    if (cursor) {
      params.cursor = cursor;
    }
    return ApiClient.get<CursorPaginatedResponse<AiSessionMessageResponse>>(
      `/v1/ai/session/${id}/messages`,
      {
        ...options,
        params: { ...options?.params, ...params },
      },
    );
  }

  static streamChat(
    dto: AiChatRequestDto,
    callbacks: {
      onSession?: (data: { sessionId: string; timestamp: string }) => void;
      onMessage?: (chunk: AiAgentStreamChunk) => void;
      onContext?: (event: AiContextStatusEvent) => void;
      onDone?: (data: AiDoneEventData) => void;
      onSessionTitle?: (data: AiSessionTitleEventData) => void;
      onError?: (error: string) => void;
      onPing?: () => void;
    },
  ): { close: () => void } {
    const controller = new AbortController();
    const { signal } = controller;

    const baseUrl = ApiClient._baseURL;

    const url = `${baseUrl}/v1/ai/chat/stream`;

    fetch(url, {
      method: "POST",
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
                  data: string | AiAgentStreamChunk | AiContextStatusEvent;
                };

                switch (event.type) {
                  case "ping":
                    callbacks.onPing?.();
                    break;
                  case "session":
                    callbacks.onSession?.(JSON.parse(event.data as string));
                    break;
                  case "message":
                    callbacks.onMessage?.({
                      ...(event.data as AiAgentStreamChunk),
                      done: false,
                    });
                    break;
                  case "context":
                    callbacks.onContext?.(event.data as AiContextStatusEvent);
                    break;
                  case "done":
                    callbacks.onDone?.(JSON.parse(event.data as string));
                    break;
                  case "session_title":
                    callbacks.onSessionTitle?.(JSON.parse(event.data as string));
                    break;
                  case "error":
                    if (typeof event.data === "string") {
                      try {
                        const parsed = JSON.parse(event.data);

                        if (typeof parsed === "string") {
                          callbacks.onError?.(parsed);
                        } else if (
                          parsed &&
                          typeof parsed === "object" &&
                          "error" in parsed &&
                          typeof parsed.error === "string"
                        ) {
                          callbacks.onError?.(parsed.error);
                        } else {
                          callbacks.onError?.(event.data);
                        }
                      } catch {
                        callbacks.onError?.(event.data);
                      }
                    } else if (
                      typeof event.data === "object" &&
                      event.data !== null &&
                      "type" in event.data &&
                      event.data.type === "error" &&
                      "content" in event.data &&
                      typeof event.data.content === "string"
                    ) {
                      callbacks.onError?.(event.data.content);
                    } else {
                      callbacks.onError?.("Unknown error");
                    }
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

  static async generateFieldBusinessNames(
    data: GenerateFieldBusinessNameRequest,
    options?: RequestOptions,
  ): Promise<GenerateFieldBusinessNameResponse> {
    return ApiClient.post<GenerateFieldBusinessNameResponse>(
      "/v1/ai/field-business-name",
      data,
      options,
    );
  }
}
