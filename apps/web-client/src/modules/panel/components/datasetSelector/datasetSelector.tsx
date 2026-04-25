import clsx from "clsx";
import { useMemo, useState } from "react";
import { Search, Database, Layers, BarChart3, FolderOpen } from "lucide-react";
import type { DatasetResponse } from "#pkg/seedar/types";
import styles from "./datasetSelector.module.scss";

const COPY = {
  loading: "\u6b63\u5728\u52a0\u8f7d\u6570\u636e\u96c6...",
  title: "\u9009\u62e9\u6570\u636e\u96c6",
  subtitle:
    "\u9009\u62e9\u540e\u53ef\u5728\u5f53\u524d\u9875\u9762\u7ee7\u7eed\u7f16\u8f91\uff0c\u5e76\u5728\u9700\u8981\u65f6\u4fdd\u5b58\u6216\u53d1\u5e03\u3002",
  searchPlaceholder:
    "\u641c\u7d22\u6570\u636e\u96c6\u540d\u79f0\u6216\u63cf\u8ff0...",
  clearSearch: "\u6e05\u9664\u641c\u7d22",
  emptySearch: "\u672a\u627e\u5230\u5339\u914d\u7684\u6570\u636e\u96c6",
  emptyDefault: "\u6682\u65e0\u53ef\u7528\u6570\u636e\u96c6",
  emptySearchDesc: "\u8bd5\u8bd5\u522b\u7684\u5173\u952e\u8bcd\u3002",
  emptyDefaultDesc:
    "\u8bf7\u5148\u521b\u5efa\u6570\u636e\u96c6\u540e\u518d\u56de\u6765\u3002",
  fieldsSuffix: "\u5b57\u6bb5",
  metricsSuffix: "\u6307\u6807",
  datasourceLabel: "\u6570\u636e\u6e90",
  cancel: "\u53d6\u6d88",
  confirm: "\u786e\u8ba4",
} as const;

interface DatasetSelectorProps {
  datasets: DatasetResponse[];
  selectedDatasetId?: number;
  onSelectDataset: (dataset: DatasetResponse) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DatasetSelector = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onConfirm,
  onCancel,
  isLoading = false,
}: DatasetSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) {
      return datasets;
    }

    const query = searchQuery.toLowerCase();
    return datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(query) ||
        dataset.description?.toLowerCase().includes(query),
    );
  }, [datasets, searchQuery]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchQuery("");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>{COPY.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.title}>{COPY.title}</h2>
          <p className={styles.subtitle}>{COPY.subtitle}</p>
        </header>

        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={COPY.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => setSearchQuery("")}
                aria-label={COPY.clearSearch}
              >
                x
              </button>
            ) : null}
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FolderOpen size={48} strokeWidth={1.5} />
            </div>
            <h3 className={styles.emptyTitle}>
              {searchQuery ? COPY.emptySearch : COPY.emptyDefault}
            </h3>
            <p className={styles.emptyDesc}>
              {searchQuery ? COPY.emptySearchDesc : COPY.emptyDefaultDesc}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredDatasets.map((dataset) => {
              const isSelected = dataset.id === selectedDatasetId;

              return (
                <button
                  type="button"
                  key={dataset.id}
                  className={clsx(styles.card, isSelected && styles.cardSelected)}
                  onClick={() => onSelectDataset(dataset)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      <Database size={20} />
                    </div>
                    <h3 className={styles.cardTitle}>{dataset.name}</h3>
                  </div>

                  {dataset.description ? (
                    <p className={styles.cardDesc}>{dataset.description}</p>
                  ) : null}

                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <Layers size={14} />
                      <span>{dataset.fields?.length || 0} {COPY.fieldsSuffix}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <BarChart3 size={14} />
                      <span>{dataset.metrics?.length || 0} {COPY.metricsSuffix}</span>
                    </div>
                  </div>

                  {dataset.datasource ? (
                    <div className={styles.cardDatasource}>
                      <span className={styles.datasourceLabel}>{COPY.datasourceLabel}</span>
                      <span className={styles.datasourceName}>
                        {dataset.datasource.name}
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.footerButton} onClick={onCancel}>
            {COPY.cancel}
          </button>
          <button
            type="button"
            className={clsx(styles.footerButton, styles.footerPrimary)}
            onClick={onConfirm}
            disabled={!selectedDatasetId}
          >
            {COPY.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
