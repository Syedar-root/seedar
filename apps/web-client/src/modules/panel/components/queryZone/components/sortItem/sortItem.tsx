import { ArrowDownWideNarrow, ArrowUpNarrowWide, X } from "lucide-react";
import styles from "./sortItem.module.scss";
import type { SortItem as PanelSortItem } from "../../../../types";

interface SortItemProps {
  sortItem: PanelSortItem;
  onToggleDirection: (sortItemId: string) => void;
  onRemove: (sortItemId: string) => void;
}

export const SortItem = ({
  sortItem,
  onToggleDirection,
  onRemove,
}: SortItemProps) => {
  const isDesc = sortItem.dir === "desc";

  return (
    <div className={styles.sortItem}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => onToggleDirection(sortItem.id)}
        title={isDesc ? "当前降序，点击切换升序" : "当前升序，点击切换降序"}
      >
        <span className={styles.label}>{sortItem.label}</span>
        <span className={styles.direction}>
          {isDesc ? <ArrowDownWideNarrow size={12} /> : <ArrowUpNarrowWide size={12} />}
          {isDesc ? "降序" : "升序"}
        </span>
      </button>
      <button
        type="button"
        className={styles.removeAction}
        onClick={() => onRemove(sortItem.id)}
        aria-label={`删除排序 ${sortItem.label}`}
      >
        <X size={12} />
      </button>
    </div>
  );
};
