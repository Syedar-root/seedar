export interface GenerateFieldBusinessNameTable {
  tableId: string;
  tableName: string;
  isEntryTable: boolean;
}

export interface GenerateFieldBusinessNameJoin {
  leftTableId: string;
  leftTableName: string;
  leftFieldId: string;
  leftFieldName: string;
  joinType: "inner" | "left" | "right" | "full";
  rightTableId: string;
  rightTableName: string;
  rightFieldId: string;
  rightFieldName: string;
}

export interface GenerateFieldBusinessNameField {
  fieldId: string;
  tableId: string;
  tableName: string;
  fieldName: string;
  currentBusinessName?: string;
  isPrimaryKey?: boolean;
}

export interface GenerateFieldBusinessNameRequest {
  aiId: string;
  entryTableId?: string;
  entryTableName?: string;
  tables: GenerateFieldBusinessNameTable[];
  joins: GenerateFieldBusinessNameJoin[];
  fields: GenerateFieldBusinessNameField[];
}

export interface GenerateFieldBusinessNameItem {
  fieldId: string;
  businessName: string;
}

export interface GenerateFieldBusinessNameResponse {
  items: GenerateFieldBusinessNameItem[];
}
