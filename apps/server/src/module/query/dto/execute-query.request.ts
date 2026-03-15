import { IsString } from 'class-validator';

export class ExecuteQueryRequest {
  @IsString()
  queryId: string;
}
