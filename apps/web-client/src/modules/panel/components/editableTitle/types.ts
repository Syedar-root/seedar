import type { SeedarTitleType } from "#pkg/seedar/ui-react";

export interface TitleConfig {
  type: SeedarTitleType;
  content: string;
  flagColor?: string;
  subtitle?: string;
  accentText?: string;
  number?: string;
  enableTooltip?: boolean;
  maxTitleWidth?: string;
}

export interface EditableTitleProps {
  title: string;
  titleConfig?: TitleConfig;
  onTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}
