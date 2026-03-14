import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateDashboardRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;
}
