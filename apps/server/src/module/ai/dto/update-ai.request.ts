import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
} from 'class-validator';
import { AiType } from '../enums/ai-status.enum';

export class UpdateAiRequest {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AiType)
  type?: AiType;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
