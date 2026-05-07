import React, { useMemo } from "react";
import { Button } from "@base-ui/react/button";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";
import clsx from "clsx";
import type { AiSessionResponse } from "#pkg/seedar/types";
import styles from "./HistorySessionMenu.module.scss";
import type { HistorySessionMenuProps } from "./types";

const formatSessionTime = (value: string | Date): string => {
  const parsed =
    typeof value === "string" && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)
      ? dayjs(value.replace(" ", "T") + "Z")
      : dayjs(value);
  const formatted = parsed.format("YYYY-MM-DD HH:mm");
  return formatted === "Invalid Date" ? "" : formatted;
};

const HistorySessionMenu: React.FC<HistorySessionMenuProps> = ({
  open,
  loading = false,
  error = null,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClose,
  anchorRef,
}) => {
  const hasItems = sessions.length > 0;

  const content = useMemo(() => {
    if (loading) {
      return <div className={styles["history-menu__state"]}>加载中...</div>;
    }

    if (error) {
      return <div className={styles["history-menu__state"]}>{error}</div>;
    }

    if (!hasItems) {
      return <div className={styles["history-menu__state"]}>暂无历史会话</div>;
    }

    return sessions.map((session) => {
      const isActive = currentSessionId === session.id;
      const updatedAt = session.updatedAt || session.createdAt;
      const displayTime = formatSessionTime(updatedAt);

      return (
        <div
          key={session.id}
          role="button"
          tabIndex={0}
          className={clsx(
            styles["history-menu__item"],
            isActive && styles["history-menu__item--active"],
          )}
          onClick={() => onSelectSession(session)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectSession(session);
            }
          }}
        >
          <div className={styles["history-menu__item-row"]}>
            <span className={styles["history-menu__item-title"]}>
              {session.title || "新对话"}
            </span>
            <Button
              type="button"
              className={styles["history-menu__delete"]}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteSession(session);
              }}
              aria-label={`删除会话 ${session.title || session.id}`}
            >
              <Trash2 size={14} />
            </Button>
          </div>
          <span className={styles["history-menu__item-time"]}>
            {displayTime}
          </span>
        </div>
      );
    });
  }, [currentSessionId, error, hasItems, loading, onDeleteSession, onSelectSession, sessions]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles["history-menu"]} ref={anchorRef}>
      <div className={styles["history-menu__header"]}>
        <span className={styles["history-menu__title"]}>历史会话</span>
      </div>
      <ScrollArea style={{ height: 320 }} contentStyle={{ padding: 8 }}>
        {content}
      </ScrollArea>
    </div>
  );
};

export default HistorySessionMenu;
