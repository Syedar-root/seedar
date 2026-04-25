import { AiStatus, AiType } from '../enums/ai-status.enum';

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
