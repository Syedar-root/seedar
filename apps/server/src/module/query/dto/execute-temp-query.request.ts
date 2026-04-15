import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { QueryDSL } from '../dsl-transformer/dsl-transformer.v2';

export class ExecuteTempQueryRequest {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  dsl: QueryDSL;
}
