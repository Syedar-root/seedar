import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasets } from "#pkg/seedar/ui-react";
import { Plus, AlertCircle, Loader2, Database } from "lucide-react";
import { DatasetCard } from "../components/DatasetCard";
import styles from "./styles/datasetPage.module.scss";
import { Select } from "@/core/components/ui/Select";

export const DatasetPage = () => {
  const navigate = useNavigate();
  const { data: datasets, isLoading, error } = useDatasets();

  const [searchInput, setSearchInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    console.log("Delete dataset:", id);
  };

  const filteredDatasets = datasets?.filter((dataset) => {
    const matchesSearch =
      !searchQuery ||
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || dataset.type === typeFilter;
    const matchesStatus = !statusFilter || dataset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>数据集管理</h1>
        <button className={styles.createButton} onClick={handleCreateDataset}>
          <Plus size={16} />
          新建数据集
        </button>
      </header>

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索数据集..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={handleSearchCompositionStart}
          onCompositionEnd={(e) => {
            handleSearchCompositionEnd((e.target as HTMLInputElement).value);
          }}
        />
        <Select
          value={typeFilter}
          onChange={(val) => setTypeFilter(val ?? "")}
          label="类型"
          placeholder="全部类型"
          options={[
            { label: "语义型", value: "semantic" },
            { label: "宽表型", value: "wide" },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(val) => setStatusFilter(val ?? "")}
          label="状态"
          placeholder="全部状态"
          options={[
            { label: "启用", value: "active" },
            { label: "禁用", value: "disabled" },
          ]}
        />
      </div>

      <main className={styles.content}>
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
            <div className={styles.emptyState}>
              <Database size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>暂无数据集</h3>
              <p className={styles.emptyDesc}>
                点击"新建数据集"按钮创建您的第一个数据集
              </p>
            </div>
          )}

        {!isLoading &&
          !error &&
          filteredDatasets &&
          filteredDatasets.length > 0 && (
            <div className={styles.grid}>
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
    </div>
  );
};
