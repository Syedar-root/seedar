import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import styles from "./ScrollArea.module.scss";
import clsx from "clsx";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <BaseScrollArea.Root className={clsx(styles.root)} style={style}>
      <BaseScrollArea.Viewport className={styles.viewport}>
        <BaseScrollArea.Content className={clsx(styles.content, className)}>
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
