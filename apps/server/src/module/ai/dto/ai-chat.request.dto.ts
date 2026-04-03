import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AiChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
