import type { ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { CircleHelp } from "lucide-react";
import styles from "./HelpTip.module.scss";

interface HelpTipProps {
  content: ReactNode;
  ariaLabel?: string;
}

const HelpTipArrow = () => {
  return (
    <svg viewBox="0 0 10 5" aria-hidden="true" width="10" height="5">
      <path d="M0 5L5 0L10 5H0Z" fill="currentColor" />
    </svg>
  );
};

export const HelpTip = ({
  content,
  ariaLabel = "查看说明",
}: HelpTipProps) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.trigger}>
          <span className={styles.icon} aria-label={ariaLabel} role="img">
            <CircleHelp size={14} />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.popup}>
              <Tooltip.Arrow className={styles.arrow}>
                <HelpTipArrow />
              </Tooltip.Arrow>
              {content}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
