export class AiSessionMessageResponse {
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

export class CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}
