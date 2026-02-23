import { IsString, IsNumber, IsObject, IsOptional } from 'class-validator';
import { QueryStatus } from '../query-status.enum';

export class CreateQueryRequest {
  @IsString()
  name: string;

  @IsNumber()
  datasetId: number;

  @IsObject()
  dsl: any;

  @IsOptional()
  status?: QueryStatus;
}
