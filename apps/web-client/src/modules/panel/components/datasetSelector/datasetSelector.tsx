import { useState, useMemo } from "react";
import { Search, Database, Layers, BarChart3, FolderOpen } from "lucide-react";
import { DatasetResponse } from "#pkg/seedar/types";
import styles from "./datasetSelector.module.scss";

interface DatasetSelectorProps {
  datasets: DatasetResponse[];
  onSelect: (dataset: DatasetResponse) => void;
  isLoading?: boolean;
}

export const DatasetSelector = ({
  datasets,
  onSelect,
  isLoading = false,
}: DatasetSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(query) ||
        dataset.description?.toLowerCase().includes(query)
    );
  }, [datasets, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>正在加载数据集...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.title}>选择数据集</h2>
          <p className={styles.subtitle}>
            请选择一个数据集来创建新的看板
          </p>
        </header>

        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索数据集名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                className={styles.clearButton}
                onClick={() => setSearchQuery("")}
                aria-label="清除搜索"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FolderOpen size={48} strokeWidth={1.5} />
            </div>
            <h3 className={styles.emptyTitle}>
              {searchQuery ? "未找到匹配的数据集" : "暂无可用数据集"}
            </h3>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? "请尝试其他搜索关键词"
                : "请先创建数据集后再创建看板"}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredDatasets.map((dataset) => (
              <button
                key={dataset.id}
                className={styles.card}
                onClick={() => onSelect(dataset)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Database size={20} />
                  </div>
                  <h3 className={styles.cardTitle}>{dataset.name}</h3>
                </div>

                {dataset.description && (
                  <p className={styles.cardDesc}>{dataset.description}</p>
                )}

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Layers size={14} />
                    <span>{dataset.fields?.length || 0} 字段</span>
                  </div>
                  <div className={styles.metaItem}>
                    <BarChart3 size={14} />
                    <span>{dataset.metrics?.length || 0} 指标</span>
                  </div>
                </div>

                {dataset.datasource && (
                  <div className={styles.cardDatasource}>
                    <span className={styles.datasourceLabel}>数据源:</span>
                    <span className={styles.datasourceName}>
                      {dataset.datasource.name}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
