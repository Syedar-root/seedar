import { IsString, IsObject, IsOptional } from 'class-validator';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface Layouts {
  lg?: LayoutItem[];
  md?: LayoutItem[];
  sm?: LayoutItem[];
  xs?: LayoutItem[];
  xxs?: LayoutItem[];
}

export class CreateDashboardRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  layout?: Layouts;
}
