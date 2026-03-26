import { ReactNode } from "react";
import { Inbox, Search, AlertCircle, MousePointerClick } from "lucide-react";
import styles from "./Empty.module.scss";
import clsx from "clsx";

export type EmptyType = "noData" | "noResult" | "error" | "noSelection";
export type EmptySize = "small" | "medium" | "large" | "fill";

export interface EmptyProps {
  type?: EmptyType;
  size?: EmptySize;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const defaultIcons: Record<EmptyType, ReactNode> = {
  noData: <Inbox />,
  noResult: <Search />,
  error: <AlertCircle />,
  noSelection: <MousePointerClick />,
};

const defaultTitles: Record<EmptyType, string> = {
  noData: "暂无数据",
  noResult: "未找到相关内容",
  error: "加载失败",
  noSelection: "请先选择",
};

const defaultDescriptions: Record<EmptyType, string> = {
  noData: "当前列表为空",
  noResult: "尝试调整搜索条件",
  error: "请稍后重试",
  noSelection: "选择后即可查看相关内容",
};

export const Empty: React.FC<EmptyProps> = ({
  type = "noData",
  size = "medium",
  icon,
  title,
  description,
  action,
  className,
  style,
}) => {
  const displayIcon = icon ?? defaultIcons[type];
  const displayTitle = title ?? defaultTitles[type];
  const displayDescription = description ?? defaultDescriptions[type];

  return (
    <div
      className={clsx(
        styles.empty,
        styles[size],
        className
      )}
      style={style}
      role="status"
      aria-label="空状态"
    >
      {displayIcon && (
        <div className={styles.iconWrapper}>
          {displayIcon}
        </div>
      )}

      {displayTitle && (
        <div className={styles.title}>
          {displayTitle}
        </div>
      )}

      {displayDescription && (
        <div className={styles.description}>
          {displayDescription}
        </div>
      )}

      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  );
};
