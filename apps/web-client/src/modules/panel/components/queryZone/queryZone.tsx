import React, { useState, useCallback } from "react";
import styles from "./queryZone.module.scss";
import { DragZone } from "../dndHelper";
import { DragItem } from "../dndHelper/dragZone/dragZone";
import { FilterItem } from "./components/filterItem";
import { FilterItem as FilterItemType } from "./types";
import { MetricItem } from "./components/metricItem/metricItem";
import { DimensionItem } from "./components/dimensionItem/dimensionItem";
import { TempMetricItem } from "./components/tempMetricItem/tempMetricItem";
import { PopDialog } from "./components/popDialog/popDialog";
import { PeriodOverPeriodType, PeriodCalculationMode } from "#pkg/seedar/types";
import type {
  DerivedDimensionInput,
  DimensionItem as PanelDimensionItem,
  TempMetricConfig,
} from "../../hooks/usePanelEditorState";
import type { DatasetFieldResponse } from "#pkg/seedar/types";
import { DerivedDimensionDialog } from "./components/derivedDimensionDialog/derivedDimensionDialog";

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
  onAddDerivedDimension?: (dimension: DerivedDimensionInput) => void;
  onUpdateDerivedDimension?: (
    dimensionItemId: string | number,
    dimension: DerivedDimensionInput,
  ) => void;
  dropFields: PanelDimensionItem[];
  dropMetrics: MetricWithPopConfig[];
  dropFilters: FilterItemType[];
  availableFields: DatasetFieldResponse[];
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
  onAddDerivedDimension,
  onUpdateDerivedDimension,
  dropFields,
  dropMetrics,
  dropFilters,
  availableFields,
}) => {
  // 同环比对话框状态
  const [popDialogOpen, setPopDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    MetricWithPopConfig | undefined
  >();
  const [derivedDialogOpen, setDerivedDialogOpen] = useState(false);
  const [configuringDimension, setConfiguringDimension] = useState<
    PanelDimensionItem | undefined
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

  const handleOpenDerivedConfig = useCallback((dimension: PanelDimensionItem) => {
    setConfiguringDimension(dimension);
    setDerivedDialogOpen(true);
  }, []);

  const handleCloseDerivedDialog = useCallback(() => {
    setDerivedDialogOpen(false);
    setConfiguringDimension(undefined);
  }, []);

  const handleSaveDerivedDimension = useCallback(
    (dimension: DerivedDimensionInput) => {
      if (!configuringDimension) {
        return;
      }

      if (configuringDimension.isDerived && onUpdateDerivedDimension) {
        onUpdateDerivedDimension(configuringDimension.id, dimension);
      } else if (onAddDerivedDimension) {
        onAddDerivedDimension(dimension);
      }
      handleCloseDerivedDialog();
    },
    [
      configuringDimension,
      handleCloseDerivedDialog,
      onAddDerivedDimension,
      onUpdateDerivedDimension,
    ],
  );

  const dimensionDerivedMap = dropFields.reduce<Record<string, boolean>>(
    (acc, dimension) => {
      if (dimension.isDerived) {
        acc[String(dimension.id)] = true;
        return acc;
      }

      const fieldId = (dimension.dimensionDsl as { fieldId?: number }).fieldId;
      if (fieldId === undefined) {
        return acc;
      }

      const hasDerived = dropFields.some((entry) => {
        if (!entry.isDerived) {
          return false;
        }
        const entryFieldId = (entry.dimensionDsl as { fieldId?: number }).fieldId;
        return entryFieldId === fieldId;
      });
      acc[String(dimension.id)] = hasDerived;
      return acc;
    },
    {},
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
            <DimensionItem
              key={item.id}
              dimension={item}
              hasDerivedConfig={Boolean(dimensionDerivedMap[String(item.id)])}
              onOpenConfig={handleOpenDerivedConfig}
              onRemove={onRemoveField}
            />
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
      <DerivedDimensionDialog
        open={derivedDialogOpen}
        availableFields={availableFields}
        existingDimensions={dropFields}
        initialDimension={configuringDimension}
        preferredFieldId={
          configuringDimension && !configuringDimension.isDerived
            ? (configuringDimension.dimensionDsl as { fieldId?: number }).fieldId
            : undefined
        }
        preferredFieldLabel={
          configuringDimension && !configuringDimension.isDerived
            ? configuringDimension.businessName || configuringDimension.name
            : undefined
        }
        onClose={handleCloseDerivedDialog}
        onSave={handleSaveDerivedDimension}
      />
    </div>
  );
};
