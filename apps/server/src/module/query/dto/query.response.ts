import { QueryStatus } from '../query-status.enum';

export class QueryResponse {
  id: number;
  name: string;
  datasetId: number;
  dsl: any;
  status: QueryStatus;
  createdAt: Date;
  updatedAt: Date;
}
