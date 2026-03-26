import { Tooltip } from "@base-ui/react/tooltip";
import React from "react";
import styles from "../title.module.css";

export function useTitleTooltip(
  content: string | undefined,
  enableTooltip: boolean,
  maxTitleWidth: string,
  children: React.ReactNode
) {
  if (!enableTooltip || !content) {
    return children;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger style={{ maxWidth: maxTitleWidth }}>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.tooltip}>{content}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
