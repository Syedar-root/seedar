import { IsString, IsNumber, IsObject, IsOptional } from 'class-validator';
import { QueryStatus } from '../query-status.enum';
import type { QueryDSL } from '../dsl-transformer';

export class CreateQueryRequest {
  @IsString()
  name: string;

  @IsNumber()
  datasetId: number;

  @IsOptional()
  @IsObject()
  dsl?: QueryDSL;

  @IsOptional()
  status?: QueryStatus;
}
