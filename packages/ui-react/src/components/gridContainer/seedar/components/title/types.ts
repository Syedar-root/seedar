export type TitleType = "plain" | "flag" | "editorial" | "brutalist";

export interface BaseTitleProps {
  content?: string;
  enableTooltip?: boolean;
  maxTitleWidth?: string;
}

export interface TitleProps extends BaseTitleProps {
  type?: TitleType;
  flagColor?: string;
  subtitle?: string;
  accentText?: string;
  number?: string;
}

export interface PlainTitleProps extends BaseTitleProps {}

export interface FlagTitleProps extends BaseTitleProps {
  flagColor?: string;
}

export interface EditorialTitleProps extends BaseTitleProps {
  subtitle?: string;
  accentText?: string;
}

export interface BrutalistTitleProps extends BaseTitleProps {
  flagColor?: string;
  subtitle?: string;
  number?: string;
}
