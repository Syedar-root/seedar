import React, { useState, useCallback, useMemo } from "react";
import { InputNumber, Select } from "antd";
import type {
  DatasetFieldResponse,
  PanelFormattingConfig,
  PanelFormattingRole,
  PanelFormattingTarget,
  PanelSimpleFormattingRule,
  QueryOrderByDSL,
} from "#pkg/seedar/types";
import styles from "./queryZone.module.scss";
import { DragZone } from "../dndHelper";
import { DragItem } from "../dndHelper/dragZone/dragZone";
import { FilterItem } from "./components/filterItem";
import { FilterItem as FilterItemType } from "./types";
import { MetricItem } from "./components/metricItem/metricItem";
import { DimensionItem } from "./components/dimensionItem/dimensionItem";
import { TempMetricItem } from "./components/tempMetricItem/tempMetricItem";
import { SortItem } from "./components/sortItem";
import { PopDialog } from "./components/popDialog/popDialog";
import type {
  DerivedDimensionInput,
  DimensionItem as PanelDimensionItem,
  PeriodOverPeriodConfig,
  SortItem as PanelSortItem,
  TempMetricConfig,
} from "../../types";
import { DerivedDimensionDialog } from "./components/derivedDimensionDialog/derivedDimensionDialog";
import { FormattingDialog } from "./components/formattingDialog/formattingDialog";
import {
  findSimpleFormattingRule,
  toSimpleFormattingConfig,
} from "../../utils/formatting";
import { buildSortCandidates } from "../../utils/querySort";

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
  onUpdateMetricPopConfig?: (
    metricId: string | number,
    config: PeriodOverPeriodConfig | undefined,
  ) => void;
  tempMetrics?: TempMetricConfig[];
  onRemoveTempMetric?: (tempMetricId: string) => void;
  sortItems?: PanelSortItem[];
  topN?: number;
  onAddSortItem?: (orderBy: QueryOrderByDSL) => void;
  onUpdateSortItem?: (
    sortItemId: string,
    updates: Partial<PanelSortItem>,
  ) => void;
  onRemoveSortItem?: (sortItemId: string) => void;
  onUpdateTopN?: (value?: number) => void;
  onAddDerivedDimension?: (dimension: DerivedDimensionInput) => void;
  onUpdateDerivedDimension?: (
    dimensionItemId: string | number,
    dimension: DerivedDimensionInput,
  ) => void;
  formatting?: PanelFormattingConfig;
  onSaveItemFormatting?: (rule: PanelSimpleFormattingRule) => void;
  onRemoveItemFormatting?: (
    target: PanelFormattingTarget,
    role: PanelFormattingRole,
  ) => void;
  dropFields: PanelDimensionItem[];
  dropMetrics: MetricWithPopConfig[];
  dropFilters: FilterItemType[];
  availableFields: DatasetFieldResponse[];
}

interface ActiveFormattingState {
  target: PanelFormattingTarget;
  role: PanelFormattingRole;
  label: string;
  existingRule?: PanelSimpleFormattingRule;
}

const buildDerivedDimensionKey = (dimension: DerivedDimensionInput): string => {
  const alias = dimension.alias;

  switch (dimension.derivedKind) {
    case "time_grain":
      return `time_grain:${dimension.fieldId}:${dimension.grain}:${alias}`;
    case "bucket":
      return `bucket:${dimension.fieldId}:${alias}`;
    case "mapping":
      return `mapping:${dimension.fieldId}:${alias}`;
    case "expression":
      return `expression:${alias}`;
    default:
      return `${(dimension as { derivedKind: string }).derivedKind}:${alias}`;
  }
};

const buildDimensionFormattingTarget = (
  dimension: PanelDimensionItem,
): PanelFormattingTarget => {
  if (dimension.isDerived) {
    const dsl = dimension.dimensionDsl as DerivedDimensionInput;
    return {
      kind: "derived_dimension",
      key: buildDerivedDimensionKey(dsl),
    };
  }

  const fieldId = (dimension.dimensionDsl as { fieldId?: number }).fieldId;
  if (fieldId !== undefined) {
    return {
      kind: "field",
      id: String(fieldId),
    };
  }

  return {
    kind: "unknown",
    id: String(dimension.id),
  };
};

const buildMetricFormattingTarget = (
  metric: MetricWithPopConfig,
): PanelFormattingTarget => ({
  kind: "metric",
  id: String(metric.id),
});

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
  sortItems = [],
  topN,
  onAddSortItem,
  onUpdateSortItem,
  onRemoveSortItem,
  onUpdateTopN,
  onAddDerivedDimension,
  onUpdateDerivedDimension,
  formatting,
  onSaveItemFormatting,
  onRemoveItemFormatting,
  dropFields,
  dropMetrics,
  dropFilters,
  availableFields,
}) => {
  const [popDialogOpen, setPopDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    MetricWithPopConfig | undefined
  >();
  const [derivedDialogOpen, setDerivedDialogOpen] = useState(false);
  const [configuringDimension, setConfiguringDimension] = useState<
    PanelDimensionItem | undefined
  >();
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [activeFormatting, setActiveFormatting] = useState<
    ActiveFormattingState | undefined
  >();
  const [sortCandidateId, setSortCandidateId] = useState<string | undefined>();

  const simpleFormatting = useMemo(
    () => toSimpleFormattingConfig(formatting),
    [formatting],
  );

  const sortCandidates = useMemo(
    () =>
      buildSortCandidates({
        dimensions: dropFields,
        metrics: dropMetrics,
        tempMetrics,
      }),
    [dropFields, dropMetrics, tempMetrics],
  );

  const activeSortCandidateIds = useMemo(
    () =>
      new Set(
        sortItems.map((item) => `${item.sourceType}:${item.sourceId}`),
      ),
    [sortItems],
  );

  const sortOptions = useMemo(
    () =>
      sortCandidates.map((candidate) => ({
        value: candidate.id,
        label: candidate.label,
        disabled: activeSortCandidateIds.has(candidate.id),
      })),
    [activeSortCandidateIds, sortCandidates],
  );

  const findFormattingRule = useCallback(
    (target: PanelFormattingTarget, role: PanelFormattingRole) => {
      return findSimpleFormattingRule(simpleFormatting, target, role);
    },
    [simpleFormatting],
  );

  const handleOpenPopDialog = useCallback((metric: MetricWithPopConfig) => {
    setSelectedMetric(metric);
    setPopDialogOpen(true);
  }, []);

  const handleClosePopDialog = useCallback(() => {
    setPopDialogOpen(false);
    setSelectedMetric(undefined);
  }, []);

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

  const openFormattingDialog = useCallback(
    (target: PanelFormattingTarget, role: PanelFormattingRole, label: string) => {
      const existingRule = findFormattingRule(target, role);
      setActiveFormatting({
        target,
        role,
        label,
        existingRule,
      });
      setFormatDialogOpen(true);
    },
    [findFormattingRule],
  );

  const handleOpenDimensionFormatting = useCallback(
    (dimension: PanelDimensionItem) => {
      openFormattingDialog(
        buildDimensionFormattingTarget(dimension),
        "dimension",
        dimension.businessName || dimension.name,
      );
    },
    [openFormattingDialog],
  );

  const handleOpenMetricFormatting = useCallback(
    (metric: MetricWithPopConfig) => {
      openFormattingDialog(
        buildMetricFormattingTarget(metric),
        "metric",
        metric.businessName || metric.name || String(metric.id),
      );
    },
    [openFormattingDialog],
  );

  const handleCloseFormattingDialog = useCallback(() => {
    setFormatDialogOpen(false);
    setActiveFormatting(undefined);
  }, []);

  const handleSaveFormatting = useCallback(
    (rule: Omit<PanelSimpleFormattingRule, "id" | "target" | "role">) => {
      if (!activeFormatting || !onSaveItemFormatting) {
        return;
      }

      onSaveItemFormatting({
        id:
          activeFormatting.existingRule?.id ||
          `fmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        target: activeFormatting.target,
        role: activeFormatting.role,
        ...rule,
      });

      handleCloseFormattingDialog();
    },
    [activeFormatting, handleCloseFormattingDialog, onSaveItemFormatting],
  );

  const handleRemoveFormatting = useCallback(() => {
    if (!activeFormatting || !onRemoveItemFormatting) {
      return;
    }

    onRemoveItemFormatting(activeFormatting.target, activeFormatting.role);
    handleCloseFormattingDialog();
  }, [activeFormatting, handleCloseFormattingDialog, onRemoveItemFormatting]);

  const handleAddSortCandidate = useCallback(
    (candidateId: string | undefined) => {
      if (!candidateId) {
        return;
      }

      const matchedCandidate = sortCandidates.find(
        (candidate) => candidate.id === candidateId,
      );
      if (!matchedCandidate || !onAddSortItem) {
        return;
      }

      onAddSortItem(matchedCandidate.orderBy);
      setSortCandidateId(undefined);
    },
    [onAddSortItem, sortCandidates],
  );

  const handleToggleSortDirection = useCallback(
    (sortItemId: string) => {
      if (!onUpdateSortItem) {
        return;
      }

      const matchedSortItem = sortItems.find((item) => item.id === sortItemId);
      if (!matchedSortItem) {
        return;
      }

      onUpdateSortItem(sortItemId, {
        dir: matchedSortItem.dir === "desc" ? "asc" : "desc",
      });
    },
    [onUpdateSortItem, sortItems],
  );

  const handleTopNChange = useCallback(
    (value: number | null) => {
      onUpdateTopN?.(value === null ? undefined : value);
    },
    [onUpdateTopN],
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
          {dropFields.map((item) => {
            const formattingTarget = buildDimensionFormattingTarget(item);
            const hasFormatting = Boolean(
              findFormattingRule(formattingTarget, "dimension"),
            );
            return (
              <DimensionItem
                key={item.id}
                dimension={item}
                hasDerivedConfig={Boolean(dimensionDerivedMap[String(item.id)])}
                hasFormattingConfig={hasFormatting}
                onOpenConfig={handleOpenDerivedConfig}
                onOpenFormattingDialog={handleOpenDimensionFormatting}
                onRemove={onRemoveField}
              />
            );
          })}
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
              onOpenFormattingDialog={handleOpenMetricFormatting}
              hasPopConfig={item.hasPopConfig}
              hasFormattingConfig={Boolean(
                findFormattingRule(buildMetricFormattingTarget(item), "metric"),
              )}
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

      <div className={`${styles.zone} ${styles.compactZone}`}>
        <div className={styles.title}>排序</div>
        <div className={styles.dragZone}>
          {sortItems.map((item) => (
            <SortItem
              key={item.id}
              sortItem={item}
              onToggleDirection={handleToggleSortDirection}
              onRemove={(sortItemId) => onRemoveSortItem?.(sortItemId)}
            />
          ))}

          <div className={styles.sortControls}>
            <Select
              size="small"
              className={styles.sortSelect}
              value={sortCandidateId}
              onChange={(value) => {
                setSortCandidateId(value);
                handleAddSortCandidate(value);
              }}
              options={sortOptions}
              placeholder={
                sortOptions.length > 0 ? "添加排序字段/指标" : "先选择维度或指标"
              }
              popupMatchSelectWidth={false}
              allowClear
            />
            <div className={styles.topNControl}>
              <span className={styles.topNLabel}>Top N</span>
              <InputNumber
                size="small"
                min={1}
                value={topN}
                onChange={handleTopNChange}
                className={styles.topNInput}
                placeholder="不限"
                disabled={sortItems.length === 0}
              />
              {topN !== undefined ? (
                <button
                  type="button"
                  className={styles.topNClear}
                  onClick={() => onUpdateTopN?.(undefined)}
                >
                  清除
                </button>
              ) : null}
            </div>
          </div>
        </div>
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

      <FormattingDialog
        open={formatDialogOpen}
        role={activeFormatting?.role || "metric"}
        targetLabel={activeFormatting?.label || ""}
        initialRule={activeFormatting?.existingRule}
        onClose={handleCloseFormattingDialog}
        onSave={handleSaveFormatting}
        onRemove={handleRemoveFormatting}
      />
    </div>
  );
};
