import { AiSessionStatus, AiSessionType } from '../ai.types';

export class AiSessionResponse {
  id: string;
  title?: string;
  type: AiSessionType;
  status: AiSessionStatus;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedAiSessionResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
