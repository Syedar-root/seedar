export class CreateDatasetRequest {
  name: string;
  datasourceId: number;
  datasourceTableIds: number[];
  description: string;
}
