import { AiType, AiStatus } from './ai.enums';

export interface AiResponse {
  id: string;
  name: string;
  description?: string;
  type: AiType;
  status: AiStatus;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAiRequest {
  name: string;
  description?: string;
  type: AiType;
  config?: Record<string, any>;
}

export interface UpdateAiRequest {
  id: string;
  name?: string;
  description?: string;
  status?: AiStatus;
  config?: Record<string, any>;
}
