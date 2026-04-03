import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { AiType } from '../enums/ai-status.enum';

export class CreateAiRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AiType)
  type: AiType;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
