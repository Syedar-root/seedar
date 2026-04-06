import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class AiChatRequestDto {
  @IsUUID()
  aiId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @IsOptional()
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsBoolean()
  isResume?: boolean;
}
