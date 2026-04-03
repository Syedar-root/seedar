import { AiSessionStatus, AiSessionType } from '../ai.types';

export class QueryAiSessionRequest {
  page?: number = 1;
  pageSize?: number = 20;
  status?: AiSessionStatus;
  type?: AiSessionType;
}

export class CreateAiSessionRequest {
  title?: string;
  type: AiSessionType = AiSessionType.CHAT;
}

export class UpdateAiSessionRequest {
  id: string;
  title?: string;
  status?: AiSessionStatus;
}
