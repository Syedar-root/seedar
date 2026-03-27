import { useState } from "react";
import { useDatasources } from "#pkg/seedar/ui-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Empty } from "@/core/components/ui/Empty";
import { Database, FileSpreadsheet, Table, Trash2 } from "lucide-react";
import clsx from "clsx";
import styles from "./DatasourceList.module.scss";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog/DeleteConfirmDialog";
import type { DatasourceResponse } from "#pkg/seedar/types";

export const DatasourceList = () => {
  const { data: datasources, isLoading } = useDatasources();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDatasource, setSelectedDatasource] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const getDatasourceIcon = (type: string) => {
    switch (type) {
      case "mysql":
      case "postgres":
      case "clickhouse":
        return <Database size={24} className={styles.icon} />;
      case "csv":
      case "excel":
        return <FileSpreadsheet size={24} className={styles.icon} />;
      default:
        return <Table size={24} className={styles.icon} />;
    }
  };

  const getDatasourceTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      mysql: "MySQL",
      postgres: "PostgreSQL",
      clickhouse: "ClickHouse",
      csv: "CSV",
      excel: "Excel",
    };
    return typeLabels[type] || type.toUpperCase();
  };

  const handleDeleteClick = (datasource: DatasourceResponse) => {
    setSelectedDatasource({
      id: datasource.id,
      name: datasource.name,
    });
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
      <ScrollArea className={styles.scrollArea}>
        <div className={styles.list}>
          {datasources?.map((datasource: DatasourceResponse) => (
            <div key={datasource.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  {getDatasourceIcon(datasource.type)}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{datasource.name}</div>
                  <div className={styles.cardType}>
                    {getDatasourceTypeLabel(datasource.type)}
                  </div>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteClick(datasource)}
                  title="删除数据源"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className={styles.cardFooter}>
                <span className={clsx(styles.status, styles[datasource.status])}>
                  {datasource.status === "active" ? "正常" : "异常"}
                </span>
              </div>
            </div>
          ))}
          {!isLoading && !datasources?.length && (
            <div className={styles.emptyWrapper}>
              <Empty type="noData" title="暂无数据源" description="请先创建数据源" />
            </div>
          )}
        </div>
      </ScrollArea>

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
