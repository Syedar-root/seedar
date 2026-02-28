import { IsNumber } from 'class-validator';

export class ExecuteQueryRequest {
  @IsNumber()
  queryId: number;
}
