import {
  IsString,
  IsEnum,
  IsObject,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PanelType } from '../panel-types.enum';
import { PanelStatus } from '../panel-status.enum';

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
  @IsEnum(PanelStatus)
  status?: PanelStatus;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}
