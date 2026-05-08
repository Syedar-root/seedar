import { AiSessionType, AiSessionStatus } from './ai-session.enums';

export interface AiSessionResponse {
  id: string;
  title?: string;
  type: AiSessionType;
  status: AiSessionStatus;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAiSessionRequest {
  title?: string;
  type?: AiSessionType;
}

export interface UpdateAiSessionRequest {
  id: string;
  title?: string;
  status?: AiSessionStatus;
}

export interface AiSessionMessageResponse {
  id: string;
  sessionId: string;
  turnId: string;
  sid: string;
  messageType: string;
  role?: string;
  contentText?: string;
  contentJson?: Record<string, unknown>;
  metaJson?: Record<string, unknown>;
  createdAt: Date;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}
