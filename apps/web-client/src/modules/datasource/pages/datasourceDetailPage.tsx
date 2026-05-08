import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDatasource } from "#pkg/seedar/ui-react";
import { Link2, Table2 } from "lucide-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import {
  DatasourceFormDialog,
  DatasourceHero,
  EmptyState,
  ErrorState,
  LoadingState,
  MetadataBar,
  RelationshipTimeline,
  TableExplorer,
} from "../components";
import styles from "./datasourceDetailPage.module.scss";

export const DatasourceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const datasourceId = id ? parseInt(id, 10) : 0;
  const { data: datasource, isLoading, error } = useDatasource(datasourceId);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState message={error.message} />
      </div>
    );
  }

  if (!datasource) {
    return (
      <div className={styles.container}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DatasourceHero
        datasource={datasource}
        onBack={() => navigate("/datasource")}
        onEdit={() => setIsEditDialogOpen(true)}
      />

      <main className={styles.mainContent}>
        <MetadataBar datasource={datasource} />
        <div
          className={`${styles.contentGrid} ${
            !datasource.foreignKeys || datasource.foreignKeys.length === 0
              ? styles.fullWidth
              : ""
          }`}
        >
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Table2 size={16} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>表结构</h2>
              <span className={styles.sectionBadge}>
                {datasource.tables?.length || 0} 张表
              </span>
            </div>

            <ScrollArea className={styles.scrollArea}>
              <TableExplorer tables={datasource.tables} />
            </ScrollArea>
          </section>

          {datasource.foreignKeys && datasource.foreignKeys.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <Link2 size={16} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>外键关系</h2>
                <span className={styles.sectionBadge}>
                  {datasource.foreignKeys.length} 个关系
                </span>
              </div>

              <ScrollArea className={styles.scrollArea}>
                <RelationshipTimeline foreignKeys={datasource.foreignKeys} />
              </ScrollArea>
            </section>
          )}
        </div>
      </main>

      <DatasourceFormDialog
        open={isEditDialogOpen}
        mode="edit"
        datasource={datasource}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
};
