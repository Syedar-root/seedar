import { TitleType } from './title-type.enum';

export interface TitleConfig {
  type?: TitleType;
  content?: string;
  enableTooltip?: boolean;
  maxTitleWidth?: string;
  flagColor?: string;
  subtitle?: string;
  accentText?: string;
}
