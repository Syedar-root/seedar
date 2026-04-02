import {
  IsString,
  IsEnum,
  IsObject,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PanelType } from '../panel-types.enum';

export class CreatePanelRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  titleConfig?: Record<string, any>;

  @IsEnum(PanelType)
  type: PanelType;

  @IsOptional()
  @IsUUID()
  queryId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}
