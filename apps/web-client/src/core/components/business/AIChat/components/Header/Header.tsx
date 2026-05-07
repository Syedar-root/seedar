import React from "react";
import { Button } from "@base-ui/react/button";
import { History, MessageCirclePlus } from "lucide-react";
import styles from "./Header.module.scss";
import type { HeaderProps } from "./types";

const ACTION_BUTTON_SIZE = 18;

const Header: React.FC<HeaderProps> = ({
  title,
  onAddChat,
  onShowHistory,
  actionsDisabled = false,
}) => {
  return (
    <div className={styles["header-container"]}>
      <div className={styles["left-section"]}>
        {onAddChat && (
          <Button
            className={styles["action-button"]}
            onClick={onAddChat}
            disabled={actionsDisabled}
          >
            <MessageCirclePlus size={ACTION_BUTTON_SIZE} />
          </Button>
        )}
      </div>

      <div className={styles["center-section"]}>{title}</div>

      <div className={styles["right-section"]}>
        {onShowHistory && (
          <Button
            className={styles["action-button"]}
            onClick={onShowHistory}
            disabled={actionsDisabled}
          >
            <History size={ACTION_BUTTON_SIZE} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
