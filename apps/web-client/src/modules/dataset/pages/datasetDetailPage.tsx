import { useParams, useNavigate } from "react-router-dom";
import { useDataset } from "#pkg/seedar/ui-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { ScrollText, BarChart3, GitMerge } from "lucide-react";
import {
  DatasetHero,
  DatasetMetadataBar,
  FieldExplorer,
  MetricList,
  JoinRelationList,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components";
import styles from "./styles/datasetDetailPage.module.scss";

export const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasetId = id ? parseInt(id, 10) : 0;
  const { data: dataset, isLoading, error } = useDataset(datasetId);

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

  if (!dataset) {
    return (
      <div className={styles.container}>
        <EmptyState />
      </div>
    );
  }

  const isWideType = dataset.type === "wide";

  return (
    <div className={styles.container}>
      <DatasetHero dataset={dataset} onBack={() => navigate("/dataset")} />

      <main className={styles.mainContent}>
        <DatasetMetadataBar dataset={dataset} />

        <div
          className={`${styles.contentGrid} ${isWideType ? styles.fullWidth : ""}`}
        >
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <ScrollText size={16} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>字段列表</h2>
              <span className={styles.sectionBadge}>
                {dataset.fields?.length || 0} 个字段
              </span>
            </div>

            <ScrollArea className={styles.scrollArea}>
              <FieldExplorer
                fields={dataset.fields || []}
                tables={dataset.tables || []}
                mainTableId={dataset.mainTableId}
              />
            </ScrollArea>
          </section>

          {!isWideType && (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <BarChart3 size={16} className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>指标列表</h2>
                  <span className={styles.sectionBadge}>
                    {dataset.metrics?.length || 0} 个指标
                  </span>
                </div>

                <ScrollArea className={styles.scrollArea}>
                  <MetricList metrics={dataset.metrics || []} fields={dataset.fields || []} />
                </ScrollArea>
              </section>

              {dataset.joins && dataset.joins.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <GitMerge size={16} className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>关联关系</h2>
                    <span className={styles.sectionBadge}>
                      {dataset.joins.length} 个关系
                    </span>
                  </div>

                  <ScrollArea className={styles.scrollArea}>
                    <JoinRelationList
                      joins={dataset.joins}
                      tables={dataset.tables || []}
                    />
                  </ScrollArea>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
