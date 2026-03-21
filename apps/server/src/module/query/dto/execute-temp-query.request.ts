import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { QueryDSL } from '../dsl-transformer';

export class ExecuteTempQueryRequest {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  dsl: QueryDSL;
}
