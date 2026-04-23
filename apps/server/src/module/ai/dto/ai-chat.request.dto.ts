import {
  IsIn,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
} from 'class-validator';

export class AiChatResumeDto {
  @IsString()
  kind: 'user_message' | 'interrupt_result';

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  interruptResult?: Record<string, unknown>;
}

export class AiChatRequestDto {
  @IsUUID()
  aiId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @IsOptional()
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsIn(['chat', 'agent'])
  mode?: 'chat' | 'agent';

  @IsOptional()
  @IsBoolean()
  isResume?: boolean;

  @IsOptional()
  @IsObject()
  resumePayload?: AiChatResumeDto;
}
