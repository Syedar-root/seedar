import React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import styles from "./ScrollArea.module.css";
import clsx from "clsx";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  contentClassName,
  style,
}) => {
  return (
    <BaseScrollArea.Root className={clsx(styles.root, className)} style={style}>
      <BaseScrollArea.Viewport
        className={styles.viewport}
        data-scroll-area-viewport
      >
        <BaseScrollArea.Content
          className={clsx(styles.content, contentClassName)}
        >
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        className={styles.scrollbar}
        orientation="vertical"
      >
        <BaseScrollArea.Thumb className={styles.thumb} />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Corner className={styles.corner} />
    </BaseScrollArea.Root>
  );
};
