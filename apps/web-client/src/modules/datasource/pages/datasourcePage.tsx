import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasources } from "#pkg/seedar/ui-react";
import type { DatasourceResponse } from "#pkg/seedar/types";
import { AlertCircle, Database, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import {
  CreateDatasourceDialog,
  DatasourceCard,
  DatasourceFormDialog,
  DeleteConfirmDialog,
} from "../components";
import styles from "./datasource.module.scss";

export const DatasourcePage = () => {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDatasource, setSelectedDatasource] =
    useState<DatasourceResponse | null>(null);
  const { data: datasources, isLoading, error } = useDatasources();

  const handleCreateDatasource = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCreateSuccess = (_datasourceId: number) => {
    setIsCreateDialogOpen(false);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/datasource/${id}`);
  };

  const handleEdit = (id: number) => {
    const datasource = datasources?.find((item) => item.id === id);
    if (!datasource) {
      return;
    }

    setSelectedDatasource(datasource);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedDatasource(null);
  };

  const handleEditSuccess = (_datasourceId: number) => {
    setIsEditDialogOpen(false);
    setSelectedDatasource(null);
  };

  const handleDelete = (id: number) => {
    const datasource = datasources?.find((item) => item.id === id);
    if (!datasource) {
      return;
    }

    setSelectedDatasource(datasource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedDatasource(null);
  };

  const handleDeleteSuccess = () => {
    handleDeleteDialogClose();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>数据源管理</h1>
        <button
          type="button"
          className={styles.createButton}
          onClick={handleCreateDatasource}
        >
          <Plus size={16} />
          创建数据源
        </button>
      </header>

      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        contentStyle={{ minWidth: 0 }}
      >
        <main className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.loadingSpinner} />
              <p className={styles.loadingText}>正在加载数据源...</p>
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

          {!isLoading && !error && (!datasources || datasources.length === 0) && (
            <div className={styles.emptyState}>
              <Database size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>暂无数据源</h3>
              <p className={styles.emptyDesc}>
                点击“创建数据源”按钮添加您的第一个数据源
              </p>
            </div>
          )}

          {!isLoading && !error && datasources && datasources.length > 0 && (
            <div className={styles.grid}>
              {datasources.map((datasource) => (
                <DatasourceCard
                  key={datasource.id}
                  datasource={datasource}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </ScrollArea>

      <CreateDatasourceDialog
        open={isCreateDialogOpen}
        onClose={handleCreateDialogClose}
        onSuccess={handleCreateSuccess}
      />

      {selectedDatasource && (
        <DatasourceFormDialog
          open={isEditDialogOpen}
          mode="edit"
          datasource={selectedDatasource}
          onClose={handleEditDialogClose}
          onSuccess={handleEditSuccess}
        />
      )}

      {selectedDatasource && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={handleDeleteDialogClose}
          datasourceId={selectedDatasource.id}
          datasourceName={selectedDatasource.name}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};
