
export class CreateDatasetFieldRequest {
  dataSourceColumnId: number;
  tableId: number;
  name: string;
  description?: string;
  businessName?: string;
  /** 是否为主键字段 */
  isPrimaryKey?: boolean;
}