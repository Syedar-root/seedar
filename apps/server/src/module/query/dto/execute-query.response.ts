export class ExecuteQueryResponse {
  sql: string;
  results: {
    header: string[];
    rows: any[];
  };
  executionTime: number;
  columnMappings?: any[];
}
