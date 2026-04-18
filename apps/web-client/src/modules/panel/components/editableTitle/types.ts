import type { TitleConfig } from "../../types";

export type { TitleConfig };

export interface EditableTitleProps {
  title: string;
  titleConfig?: TitleConfig;
  onTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}
