import React, { useState, useCallback } from "react";
import styles from "./queryZone.module.scss";
import { DragZone } from "../dndHelper";
import { DragItem } from "../dndHelper/dragZone/dragZone";
import { X } from "lucide-react";
import { FilterItem } from "./components/filterItem";
import { FilterItem as FilterItemType } from "./types";
import { MetricItem } from "./components/metricItem/metricItem";
import { TempMetricItem } from "./components/tempMetricItem/tempMetricItem";
import { PopDialog } from "./components/popDialog/popDialog";
import { PeriodOverPeriodType, PeriodCalculationMode } from "#pkg/seedar/types";
import type { TempMetricConfig } from "../../hooks/usePanelEditorState";

// 同环比配置接口
export interface PeriodOverPeriodConfig {
  periodType?: PeriodOverPeriodType;
  calculationMode?: PeriodCalculationMode;
}

// 带同环比配置状态的指标项（用于显示配置按钮状态）
export interface MetricWithPopConfig extends DragItem {
  hasPopConfig?: boolean;
}

interface QueryZoneProps {
  onDropField: (item: DragItem) => void;
  onDropMetric: (item: DragItem) => void;
  onDropFilter: (item: DragItem) => void;
  onRemoveField: (item: DragItem) => void;
  onRemoveMetric: (item: DragItem) => void;
  onRemoveFilter: (id: string | number) => void;
  onUpdateFilter: (
    id: string | number,
    updates: Partial<FilterItemType>,
  ) => void;
  // 同环比配置相关
  onUpdateMetricPopConfig?: (
    metricId: string | number,
    config: PeriodOverPeriodConfig | undefined,
  ) => void;
  // 临时指标相关
  tempMetrics?: TempMetricConfig[];
  onRemoveTempMetric?: (tempMetricId: string) => void;
  dropFields: DragItem[];
  dropMetrics: MetricWithPopConfig[];
  dropFilters: FilterItemType[];
}

export const QueryZone: React.FC<QueryZoneProps> = ({
  onDropField,
  onDropMetric,
  onDropFilter,
  onRemoveField,
  onRemoveMetric,
  onRemoveFilter,
  onUpdateFilter,
  onUpdateMetricPopConfig,
  tempMetrics = [],
  onRemoveTempMetric,
  dropFields,
  dropMetrics,
  dropFilters,
}) => {
  // 同环比对话框状态
  const [popDialogOpen, setPopDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    MetricWithPopConfig | undefined
  >();

  // 打开同环比配置对话框
  const handleOpenPopDialog = useCallback((metric: MetricWithPopConfig) => {
    setSelectedMetric(metric);
    setPopDialogOpen(true);
  }, []);

  // 关闭同环比配置对话框
  const handleClosePopDialog = useCallback(() => {
    setPopDialogOpen(false);
    setSelectedMetric(undefined);
  }, []);

  // 保存同环比配置
  const handleSavePopConfig = useCallback(
    (config: PeriodOverPeriodConfig) => {
      if (selectedMetric && onUpdateMetricPopConfig) {
        onUpdateMetricPopConfig(selectedMetric.id, config);
      }
      handleClosePopDialog();
    },
    [selectedMetric, onUpdateMetricPopConfig, handleClosePopDialog],
  );

  return (
    <div className={styles.queryZone}>
      <div className={styles.zone}>
        <div className={styles.title}>维度</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropField}
          itemType="fieldItem"
          overColor="#d4dde5"
        >
          {dropFields.map((item) => (
            <div className={styles.field} key={item.id}>
              {item.businessName || item.name}
              <X size={12} onClick={() => onRemoveField(item)} />
            </div>
          ))}
        </DragZone>
      </div>
      <div className={styles.zone}>
        <div className={styles.title}>指标</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropMetric}
          itemType="metricItem"
          overColor="#d5ded8"
        >
          {dropMetrics.map((item) => (
            <MetricItem
              key={item.id}
              metric={item}
              onRemove={onRemoveMetric}
              onOpenPopDialog={handleOpenPopDialog}
              hasPopConfig={item.hasPopConfig}
            />
          ))}
          {tempMetrics.map((item) => (
            <TempMetricItem
              key={item.id}
              tempMetric={item}
              onRemove={onRemoveTempMetric}
            />
          ))}
        </DragZone>
      </div>
      <div className={styles.zone}>
        <div className={styles.title}>筛选</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropFilter}
          itemType="fieldItem"
          overColor="#e5d4d4"
        >
          {dropFilters.map((filter) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              onUpdate={onUpdateFilter}
              onRemove={onRemoveFilter}
            />
          ))}
        </DragZone>
      </div>
      <PopDialog
        open={popDialogOpen}
        metric={selectedMetric}
        initialConfig={
          selectedMetric?.hasPopConfig
            ? tempMetrics.find(
                (tm) => tm.baseMetricId === Number(selectedMetric.id),
              )
            : undefined
        }
        onClose={handleClosePopDialog}
        onSave={handleSavePopConfig}
      />
    </div>
  );
};
