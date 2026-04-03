import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { AiSessionType, AiSessionStatus } from '../enums';

export class QueryAiSessionRequest {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(AiSessionStatus)
  status?: AiSessionStatus;

  @IsOptional()
  @IsEnum(AiSessionType)
  type?: AiSessionType;
}

export class CreateAiSessionRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(AiSessionType)
  type?: AiSessionType = AiSessionType.CHAT;
}

export class UpdateAiSessionRequest {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(AiSessionStatus)
  status?: AiSessionStatus;
}
