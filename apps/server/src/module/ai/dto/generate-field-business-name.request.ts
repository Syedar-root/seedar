import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class GenerateFieldBusinessNameTableDto {
  @IsString()
  tableId: string;

  @IsString()
  tableName: string;

  @IsBoolean()
  isEntryTable: boolean;
}

export class GenerateFieldBusinessNameJoinDto {
  @IsString()
  leftTableId: string;

  @IsString()
  leftTableName: string;

  @IsString()
  leftFieldId: string;

  @IsString()
  leftFieldName: string;

  @IsIn(['inner', 'left', 'right', 'full'])
  joinType: 'inner' | 'left' | 'right' | 'full';

  @IsString()
  rightTableId: string;

  @IsString()
  rightTableName: string;

  @IsString()
  rightFieldId: string;

  @IsString()
  rightFieldName: string;
}

export class GenerateFieldBusinessNameFieldDto {
  @IsString()
  fieldId: string;

  @IsString()
  tableId: string;

  @IsString()
  tableName: string;

  @IsString()
  fieldName: string;

  @IsOptional()
  @IsString()
  currentBusinessName?: string;

  @IsOptional()
  @IsBoolean()
  isPrimaryKey?: boolean;
}

export class GenerateFieldBusinessNameRequestDto {
  @IsUUID()
  aiId: string;

  @IsOptional()
  @IsString()
  entryTableId?: string;

  @IsOptional()
  @IsString()
  entryTableName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateFieldBusinessNameTableDto)
  tables: GenerateFieldBusinessNameTableDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateFieldBusinessNameJoinDto)
  joins: GenerateFieldBusinessNameJoinDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateFieldBusinessNameFieldDto)
  fields: GenerateFieldBusinessNameFieldDto[];
}

export class GenerateFieldBusinessNameItemDto {
  fieldId: string;
  businessName: string;
}

export class GenerateFieldBusinessNameResponseDto {
  items: GenerateFieldBusinessNameItemDto[];
}
