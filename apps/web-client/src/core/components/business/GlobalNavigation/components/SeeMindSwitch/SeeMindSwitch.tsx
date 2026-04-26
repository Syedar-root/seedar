import { Cpu } from "lucide-react";
import styles from "./SeeMindSwitch.module.scss";
import type { SeeMindSwitchProps } from "./types";

const seeMindLetters = ["S", "E", "E", "M", "I", "N", "D"];

export const SeeMindSwitch = ({
  isActive,
  onToggle,
}: SeeMindSwitchProps) => {
  const switchAriaLabel = isActive
    ? "关闭 SeeMind 侧边对话框"
    : "打开 SeeMind 侧边对话框";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={switchAriaLabel}
      className={`${styles.seeMindSwitch} ${
        isActive ? styles.seeMindSwitchActive : ""
      }`}
      onClick={onToggle}
    >
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchActiveField} />
        <span className={styles.switchText}>
          {seeMindLetters.map((letter, index) => (
            <span key={`${letter}-${index}`} className={styles.switchTextLetter}>
              {letter}
            </span>
          ))}
        </span>
        <span className={styles.switchThumb}>
          <Cpu size={18} strokeWidth={2.1} />
        </span>
      </span>
    </button>
  );
};
