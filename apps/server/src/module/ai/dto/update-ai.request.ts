import { AiType } from '../ai.types';

export class UpdateAiRequest {
  id: string;
  name?: string;
  description?: string;
  type?: AiType;
  config?: Record<string, any>;
}
