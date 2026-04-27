import type { DatasetResponse } from "#pkg/seedar/types";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Tooltip } from "antd";
import styles from "./aside.module.scss";
import { DragItem } from "../dndHelper/drapItem";
import { Database, GripVertical, Plus, Search, Tags } from "lucide-react";
import { MetricEditorDialog } from "../metricEditor";
import { ScrollArea } from "@/core/components/ui/ScrollArea";

const COPY = {
  datasetLabel: "数据集",
  datasetHintSelected: "字段和指标会跟随当前数据集变化",
  datasetEmptyTitle: "尚未选择数据集",
  datasetHintEmpty: "先选择一个数据集，再拖拽字段和指标构建查询",
  datasetActionChange: "更换数据集",
  datasetActionLocked: "数据集已锁定",
  datasetActionSelect: "选择数据集",
  sidebarDesc: "选择字段和指标，构建查询",
  sidebarHint: "拖拽到右侧区域即可使用",
  emptyTitle: "等待数据集",
  emptyDesc: "数据集选定后，这里会展示可拖拽的字段和指标。",
  fieldsTitle: "字段",
  metricsTitle: "指标",
  addMetricTitle: "添加指标",
  searchPlaceholder: "搜索字段或指标",
  toggleTableTag: "显示表来源",
  emptySearch: "没有匹配的字段或指标",
} as const;

interface AsideProps {
  className?: string;
  fields: DatasetResponse["fields"];
  metrics: DatasetResponse["metrics"];
  datasetId?: number;
  datasetName?: string;
  hasDataset: boolean;
  canChangeDataset?: boolean;
  onOpenDatasetSelector: () => void;
  onMetricCreated?: () => void;
}

const normalizeText = (value: string | undefined) => value?.toLowerCase() || "";

export const Aside: React.FC<AsideProps> = ({
  className,
  fields,
  metrics,
  datasetId,
  datasetName,
  hasDataset,
  canChangeDataset = true,
  onOpenDatasetSelector,
  onMetricCreated,
}) => {
  const [isMetricEditorOpen, setIsMetricEditorOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showTableTag, setShowTableTag] = useState(true);

  const handleOpenMetricEditor = () => {
    setIsMetricEditorOpen(true);
  };

  const handleCloseMetricEditor = () => {
    setIsMetricEditorOpen(false);
  };

  const handleMetricCreated = () => {
    setIsMetricEditorOpen(false);
    onMetricCreated?.();
  };

  const numericFields = useMemo(
    () =>
      fields.filter(
        (field) => field.type === "number" || field.type === "decimal",
      ),
    [fields],
  );

  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();

  const filteredFields = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return fields;
    }

    return fields.filter((field) => {
      const targetTexts = [
        normalizeText(field.businessName),
        normalizeText(field.name),
        normalizeText(field.tableName),
      ];

      return targetTexts.some((text) => text.includes(normalizedSearchKeyword));
    });
  }, [fields, normalizedSearchKeyword]);

  const filteredMetrics = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return metrics;
    }

    return metrics.filter((metric) => {
      const targetTexts = [
        normalizeText(metric.businessName),
        normalizeText(metric.name),
      ];

      return targetTexts.some((text) => text.includes(normalizedSearchKeyword));
    });
  }, [metrics, normalizedSearchKeyword]);

  const fieldItems = useMemo(
    () =>
      filteredFields.map((field) => {
        const fieldLabel = field.businessName || field.name;
        const tableLabel = field.tableName;

        return (
          <DragItem
            className={styles.dragItem}
            key={field.id}
            dragId={field.id}
            itemType="fieldItem"
            dragingStyle={{
              opacity: 0.5,
              backgroundColor: "var(--accent-1)",
            }}
          >
            <GripVertical className={styles.dragHandle} />
            <div className={styles.dragContent}>
              <Tooltip title={fieldLabel}>
                <span className={styles.itemLabel}>{fieldLabel}</span>
              </Tooltip>
              {showTableTag && tableLabel ? (
                <span className={styles.tableTag}>{tableLabel}</span>
              ) : null}
            </div>
          </DragItem>
        );
      }),
    [filteredFields, showTableTag],
  );

  const metricItems = useMemo(
    () =>
      filteredMetrics.map((metric) => {
        const metricLabel = metric.businessName || metric.name;

        return (
          <DragItem
            className={styles.dragItem}
            key={metric.id}
            dragId={metric.id}
            itemType="metricItem"
            dragingStyle={{
              opacity: 0.5,
              backgroundColor: "var(--accent-2)",
            }}
          >
            <GripVertical className={styles.dragHandle} />
            <div className={styles.dragContent}>
              <Tooltip title={metricLabel}>
                <span className={styles.itemLabel}>{metricLabel}</span>
              </Tooltip>
            </div>
          </DragItem>
        );
      }),
    [filteredMetrics],
  );

  return (
    <aside className={clsx(styles.sidebar, className)}>
      <div className={styles.datasetCard}>
        <div className={styles.datasetMeta}>
          <span className={styles.datasetLabel}>{COPY.datasetLabel}</span>
          {hasDataset ? (
            <>
              <span className={styles.datasetName}>{datasetName}</span>
              <span className={styles.datasetHint}>
                {COPY.datasetHintSelected}
              </span>
            </>
          ) : (
            <>
              <span className={styles.datasetEmptyTitle}>
                {COPY.datasetEmptyTitle}
              </span>
              <span className={styles.datasetHint}>{COPY.datasetHintEmpty}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className={styles.datasetAction}
          onClick={onOpenDatasetSelector}
          disabled={hasDataset && !canChangeDataset}
        >
          {hasDataset
            ? canChangeDataset
              ? COPY.datasetActionChange
              : COPY.datasetActionLocked
            : COPY.datasetActionSelect}
        </button>
      </div>

      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarDesc}>{COPY.sidebarDesc}</span>
        <span className={styles.sidebarHint}>{COPY.sidebarHint}</span>
        {hasDataset ? (
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder={COPY.searchPlaceholder}
              />
            </label>
            <button
              type="button"
              className={clsx(styles.toggleTagButton, {
                [styles.toggleTagButtonActive]: showTableTag,
              })}
              onClick={() => setShowTableTag((current) => !current)}
            >
              <Tags size={14} />
              {COPY.toggleTableTag}
            </button>
          </div>
        ) : null}
      </div>

      {!hasDataset ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Database size={28} />
          </div>
          <div className={styles.emptyTitle}>{COPY.emptyTitle}</div>
          <div className={styles.emptyDesc}>{COPY.emptyDesc}</div>
        </div>
      ) : (
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarSection}>
            <h2 className={styles.sidebarSectionTitle}>{COPY.fieldsTitle}</h2>
            <ScrollArea className={styles.fieldList}>
              <ul className={styles.sidebarList}>{fieldItems}</ul>
            </ScrollArea>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sidebarSectionTitle}>{COPY.metricsTitle}</h2>
              {datasetId ? (
                <button
                  className={styles.addButton}
                  onClick={handleOpenMetricEditor}
                  title={COPY.addMetricTitle}
                >
                  <Plus size={14} />
                </button>
              ) : null}
            </div>
            <ScrollArea className={styles.fieldList}>
              <ul className={styles.sidebarList}>{metricItems}</ul>
            </ScrollArea>
          </div>
          {fieldItems.length === 0 && metricItems.length === 0 ? (
            <div className={styles.searchEmpty}>{COPY.emptySearch}</div>
          ) : null}
        </div>
      )}

      {datasetId && isMetricEditorOpen ? (
        <MetricEditorDialog
          datasetId={datasetId}
          fields={fields}
          metrics={metrics}
          numericFields={numericFields}
          onClose={handleCloseMetricEditor}
          onSuccess={handleMetricCreated}
        />
      ) : null}
    </aside>
  );
};
