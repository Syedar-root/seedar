import { forwardRef } from "react";

import { GridPanel } from "../../layout/GridPanel";
import { Title } from "../../shared/Title";
import { useSeedarPanelContent } from "./hooks/useSeedarPanelContent.hook";
import { useSeedarPanelData } from "./hooks/useSeedarPanelData.hook";
import type { SeedarPanelProps } from "./types";

export const SeedarPanel = forwardRef<HTMLDivElement, SeedarPanelProps>(
  (
    {
      panelId,
      panel,
      className = "",
      style = {},
      headerExtra,
      data,
      onChartRenderStatusChange,
      ...rest
    },
    ref,
  ) => {
    const { finalPanel, isPending, isError } = useSeedarPanelData({
      panelId,
      panel,
    });
    const content = useSeedarPanelContent({
      data,
      finalPanel,
      onChartRenderStatusChange,
    });

    if (!finalPanel && isPending) {
      return null;
    }

    if (isError || !finalPanel) {
      return null;
    }

    const { title, titleConfig } = finalPanel;

    return (
      <GridPanel
        panelId={panelId}
        title={<Title {...titleConfig} content={title} />}
        ref={ref}
        content={content}
        className={className}
        style={style}
        headerExtra={headerExtra?.(panelId)}
        {...rest}
      />
    );
  },
);
