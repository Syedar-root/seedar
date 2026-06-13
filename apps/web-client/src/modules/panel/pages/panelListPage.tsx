import { Empty, Popconfirm } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { PanelStatus } from "#pkg/seedar/types";
import { Select } from "@/core/components/ui/Select";
import { usePanelListPageViewModel } from "../hooks";
import styles from "./styles/panelList.module.scss";

export const PanelListPage = () => {
  const {
    isLoading,
    filteredPanels,
    searchInput,
    statusFilter,
    datasetFilter,
    handleSearchChange,
    handleSearchCompositionStart,
    handleSearchCompositionEnd,
    handleStatusFilterChange,
    handleDatasetFilterChange,
    handleCreatePanel,
    handleOpenPanel,
    handleStatusToggle,
    handleDelete,
  } = usePanelListPageViewModel();

  return (
    <div className={styles.container}>
      <header className={styles.header} data-tour-id="panel-list-page-header">
        <h1 className={styles.title}>面板管理</h1>
        <button
          className={styles.createButton}
          onClick={handleCreatePanel}
          data-tour-id="panel-create-button"
        >
          <Plus size={16} />
          新建面板
        </button>
      </header>

      <div className={styles.filters} data-tour-id="panel-list-filters">
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索面板..."
          value={searchInput}
          onChange={(event) => handleSearchChange(event.target.value)}
          onCompositionStart={handleSearchCompositionStart}
          onCompositionEnd={(event) => {
            handleSearchCompositionEnd((event.target as HTMLInputElement).value);
          }}
          data-tour-id="panel-search-input"
        />
        <Select
          value={statusFilter}
          onChange={(value) => handleStatusFilterChange(value ?? "")}
          label="状态"
          placeholder="全部状态"
          options={[
            { label: "草稿", value: PanelStatus.DRAFT },
            { label: "已发布", value: PanelStatus.PUBLISHED },
          ]}
        />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="筛选数据集..."
          value={datasetFilter}
          onChange={(event) => handleDatasetFilterChange(event.target.value)}
        />
      </div>

      <main className={styles.content} data-tour-id="panel-list-page-content">
        {isLoading ? (
          <div>加载中...</div>
        ) : filteredPanels.length === 0 ? (
          <Empty description="暂无面板" />
        ) : (
          <div className={styles.grid} data-tour-id="panel-grid">
            {filteredPanels.map((panel) => (
              <article
                key={panel.id}
                className={styles.card}
                onClick={() => handleOpenPanel(panel.id)}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    {panel.title || "未命名面板"}
                  </h2>
                  <span
                    className={`${styles.badge} ${
                      panel.status === PanelStatus.PUBLISHED
                        ? styles.published
                        : styles.draft
                    }`}
                  >
                    {panel.status === PanelStatus.PUBLISHED ? "已发布" : "草稿"}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  创建于 {new Date(panel.createdAt).toLocaleDateString()}
                  {panel.datasetName && ` · ${panel.datasetName}`}
                </div>
                <div
                  className={styles.cardActions}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className={styles.btnGhost}
                    onClick={() => handleStatusToggle(panel)}
                    type="button"
                  >
                    {panel.status === PanelStatus.DRAFT ? "发布" : "撤销"}
                  </button>
                  <Popconfirm
                    overlayClassName={styles.deletePopconfirm}
                    title="确认删除该面板？"
                    onConfirm={() => handleDelete(panel.id)}
                    okText="确认"
                    cancelText="取消"
                  >
                    <button
                      className={`${styles.btnGhost} ${styles.btnDanger}`}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Popconfirm>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
