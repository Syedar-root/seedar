import { AiStatus, AiType } from '../ai.types';

export class AiResponse {
  id: string;
  name: string;
  description?: string;
  type: AiType;
  status: AiStatus;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
