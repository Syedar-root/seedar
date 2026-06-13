import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasets } from "#pkg/seedar/ui-react";
import { Plus, AlertCircle, Loader2, Database } from "lucide-react";
import { DatasetCard, DeleteConfirmDialog } from "../components";
import styles from "./styles/datasetPage.module.scss";

export const DatasetPage = () => {
  const navigate = useNavigate();
  const { data: datasets, isLoading, error } = useDatasets();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (!isComposing) {
      setSearchQuery(value);
    }
  };

  const handleSearchCompositionStart = () => {
    setIsComposing(true);
  };

  const handleSearchCompositionEnd = (value: string) => {
    setIsComposing(false);
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleCreateDataset = () => {
    navigate("/dataset/create");
  };

  const handleViewDetails = (id: number) => {
    navigate(`/dataset/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/dataset/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    const dataset = datasets?.find((item) => item.id === id);
    if (dataset) {
      setSelectedDataset({
        id: dataset.id,
        name: dataset.name,
      });
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedDataset(null);
  };

  const handleDeleteSuccess = () => {
    handleDeleteDialogClose();
  };

  const filteredDatasets = datasets?.filter((dataset) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      dataset.name.toLowerCase().includes(q) ||
      dataset.description?.toLowerCase().includes(q) ||
      dataset.datasource?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.container}>
      <header className={styles.header} data-tour-id="dataset-page-header">
        <h1 className={styles.title}>数据集管理</h1>
        <button
          className={styles.createButton}
          onClick={handleCreateDataset}
          data-tour-id="dataset-create-button"
        >
          <Plus size={16} />
          新建数据集
        </button>
      </header>

      <div className={styles.filters} data-tour-id="dataset-page-filters">
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索数据集或数据源..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={handleSearchCompositionStart}
          onCompositionEnd={(e) => {
            handleSearchCompositionEnd((e.target as HTMLInputElement).value);
          }}
          data-tour-id="dataset-search-input"
        />
      </div>

      <main className={styles.content} data-tour-id="dataset-page-content">
        {isLoading && (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.loadingSpinner} />
            <p className={styles.loadingText}>正在加载数据集...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <AlertCircle size={32} className={styles.errorIcon} />
            <p className={styles.errorText}>
              加载失败：{error.message || "请稍后重试"}
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          (!filteredDatasets || filteredDatasets.length === 0) && (
            <div className={styles.emptyState} data-tour-id="dataset-empty-state">
              <Database size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>暂无数据集</h3>
              <p className={styles.emptyDesc}>
                点击“新建数据集”按钮创建您的第一个数据集
              </p>
            </div>
          )}

        {!isLoading &&
          !error &&
          filteredDatasets &&
          filteredDatasets.length > 0 && (
            <div className={styles.grid} data-tour-id="dataset-grid">
              {filteredDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
      </main>

      {selectedDataset && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={handleDeleteDialogClose}
          datasetId={selectedDataset.id}
          datasetName={selectedDataset.name}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};
