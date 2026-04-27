import {
  Database,
  Trash2,
  BarChart3,
  Pencil,
  Layers,
  GitMerge,
  ScrollText,
} from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { DatasetResponse } from "#pkg/seedar/types";
import styles from "./DatasetCard.module.scss";
import tooltipStyles from "./tooltip.module.scss";

interface DatasetCardProps {
  dataset: DatasetResponse;
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const DatasetCard = ({
  dataset,
  onViewDetails,
  onEdit,
  onDelete,
}: DatasetCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger className={styles.titleTrigger}>
              <div className={styles.titleSection}>
                <Database size={20} className={styles.icon} />
                <h3 className={styles.name}>{dataset.name}</h3>
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className={tooltipStyles.tooltip}>
                  {dataset.name}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      <div className={styles.content}>
        {dataset.description && (
          <p className={styles.description}>{dataset.description}</p>
        )}

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Layers size={13} />
            <span>{dataset.tables?.length || 0} 表</span>
          </span>
          <span className={styles.separator}>·</span>
          <span className={styles.metaItem}>
            <ScrollText size={13} />
            <span>{dataset.fields?.length || 0} 字段</span>
          </span>
          <span className={styles.separator}>·</span>
          <span className={styles.metaItem}>
            <BarChart3 size={13} />
            <span>{dataset.metrics?.length || 0} 指标</span>
          </span>
          <span className={styles.separator}>·</span>
          <span className={styles.metaItem}>
            <GitMerge size={13} />
            <span>{dataset.joins?.length || 0} 关联</span>
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.primaryAction}
          onClick={() => onViewDetails?.(dataset.id)}
          title="进入模型"
        >
          <BarChart3 size={14} />
          进入模型
        </button>
        <button
          className={styles.secondaryAction}
          onClick={() => onEdit?.(dataset.id)}
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          className={styles.dangerAction}
          onClick={() => onDelete?.(dataset.id)}
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
