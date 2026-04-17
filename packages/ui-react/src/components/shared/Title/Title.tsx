import React from "react";
import { TitleProps, TitleType } from "./types";
import { useTitleTooltip } from "./components/Tooltip/hooks/useTitleTooltip";
import { PlainTitle } from "./components/PlainTitle";
import { FlagTitle } from "./components/FlagTitle";
import { EditorialTitle } from "./components/EditorialTitle";
import { BrutalistTitle } from "./components/BrutalistTitle";

const titleRenderers: Record<TitleType, (props: any) => React.ReactNode> = {
  plain: PlainTitle,
  flag: FlagTitle,
  editorial: EditorialTitle,
  brutalist: BrutalistTitle,
};

export const Title: React.FC<TitleProps> = ({
  content,
  type = "plain",
  enableTooltip = true,
  maxTitleWidth = "100%",
  ...props
}: TitleProps) => {
  const TitleComponent = titleRenderers[type];
  const titleElement = (
    <TitleComponent
      content={content}
      maxTitleWidth={maxTitleWidth}
      {...props}
    />
  );

  return useTitleTooltip(content, enableTooltip, maxTitleWidth, titleElement);
};

export type {
  TitleType,
  TitleProps,
  BaseTitleProps,
  PlainTitleProps,
  FlagTitleProps,
  EditorialTitleProps,
  BrutalistTitleProps,
} from "./types";
