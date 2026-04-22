import type { Ref, UIEventHandler } from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import styles from "./ScrollArea.module.scss";
import clsx from "clsx";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  viewportRef?: Ref<HTMLDivElement>;
  onViewportScroll?: UIEventHandler<HTMLDivElement>;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  style,
  contentStyle,
  viewportRef,
  onViewportScroll,
}) => {
  return (
    <BaseScrollArea.Root className={clsx(styles.root)} style={style}>
      <BaseScrollArea.Viewport
        className={styles.viewport}
        ref={viewportRef}
        onScroll={onViewportScroll}
      >
        <BaseScrollArea.Content
          className={clsx(styles.content, className)}
          style={contentStyle}
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
