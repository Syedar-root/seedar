import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import styles from "./sortItem.module.scss";
import type { SortItem as PanelSortItem } from "../../../../types";

interface SortItemProps {
  sortItem: PanelSortItem;
}

export const SortItem = ({ sortItem }: SortItemProps) => {
  const isDesc = sortItem.dir === "desc";

  return (
    <div className={styles.sortItem}>
      <span className={styles.label}>{sortItem.label}</span>
      <span className={styles.direction}>
        {isDesc ? <ArrowDownWideNarrow size={12} /> : <ArrowUpNarrowWide size={12} />}
        {isDesc ? "降序" : "升序"}
      </span>
    </div>
  );
};
