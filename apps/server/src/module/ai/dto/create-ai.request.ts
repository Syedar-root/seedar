import { AiType } from '../ai.types';

export class CreateAiRequest {
  name: string;
  description?: string;
  type: AiType;
  config?: Record<string, any>;
}
