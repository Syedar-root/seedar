import { Switch as BaseSwitch } from "@base-ui/react";
import styles from "./Switch.module.scss";
import clsx from "clsx";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Switch = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  className,
  style,
}: SwitchProps) => {
  return (
    <BaseSwitch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={clsx(styles.Switch, className)}
      style={style}
    >
      <BaseSwitch.Thumb className={styles.Thumb} />
    </BaseSwitch.Root>
  );
};
