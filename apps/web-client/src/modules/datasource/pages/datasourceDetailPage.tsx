import { useParams, useNavigate } from "react-router-dom";
import { useDatasource } from "#pkg/seedar/ui-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import {
  Key,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Database,
  Table2,
  Link2,
} from "lucide-react";
import styles from "./datasourceDetailPage.module.scss";

export const DatasourceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasourceId = id ? parseInt(id, 10) : 0;
  const { data: datasource, isLoading, error } = useDatasource(datasourceId);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "正常",
      invalid: "无效",
      deleted: "已删除",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    return styles[`status-${status}`] || styles.statusInvalid;
  };

  const getNormalizedTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      string: "字符串",
      number: "数字",
      date: "日期",
      boolean: "布尔",
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.loadingSpinner} />
          <p className={styles.loadingText}>正在加载数据源详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <p className={styles.errorText}>
            加载失败：{error.message || "请稍后重试"}
          </p>
        </div>
      </div>
    );
  }

  if (!datasource) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Database size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>数据源不存在</h3>
          <p className={styles.emptyDesc}>请检查数据源 ID 是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/datasource")}
          aria-label="返回数据源列表"
        >
          <ArrowLeft size={20} />
        </button>

        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            <div className={styles.typeIcon}>
              <Database size={24} />
            </div>
            <span className={styles.typeLabel}>{datasource.type}</span>
            <span
              className={`${styles.statusBadge} ${getStatusClass(
                datasource.status,
              )}`}
            >
              {getStatusText(datasource.status)}
            </span>
          </div>

          <h1 className={styles.heroTitle}>{datasource.name}</h1>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.tables?.length || 0}
              </div>
              <div className={styles.statLabel}>数据表</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.tables?.reduce(
                  (sum, table) => sum + table.columns.length,
                  0,
                ) || 0}
              </div>
              <div className={styles.statLabel}>字段总数</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.foreignKeys?.length || 0}
              </div>
              <div className={styles.statLabel}>外键关系</div>
            </div>
          </div>
        </div>
      </div>


        <main className={styles.mainContent}>
          <div className={styles.metadataBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>创建于</span>
              <span className={styles.metaValue}>
                {new Date(datasource.createdAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>最后更新</span>
              <span className={styles.metaValue}>
                {new Date(datasource.updatedAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {datasource.lastValidateAt && (
              <>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>最后验证</span>
                  <span className={styles.metaValue}>
                    {new Date(datasource.lastValidateAt).toLocaleDateString(
                      "zh-CN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
          <div
            className={`${styles.contentGrid} ${!datasource.foreignKeys || datasource.foreignKeys.length === 0 ? styles.fullWidth : ""}`}
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
                {datasource.tables && datasource.tables.length > 0 ? (
                  <div className={styles.tableExplorer}>
                    {datasource.tables.map((table, index) => (
                      <div
                        key={index}
                        className={styles.tableNode}
                        style={
                          {
                            "--delay": `${index * 0.05}s`,
                          } as React.CSSProperties
                        }
                      >
                        <div className={styles.tableNodeHeader}>
                          <div className={styles.tableNodeIcon}>
                            <Table2 size={14} />
                          </div>
                          <h3 className={styles.tableNodeName}>
                            {table.tableName}
                          </h3>
                          <span className={styles.tableNodeCount}>
                            {table.columns.length} 字段
                          </span>
                        </div>

                        <div className={styles.tableNodeContent}>
                          {table.columns.map((column, colIndex) => (
                            <div key={colIndex} className={styles.fieldRow}>
                              <div className={styles.fieldName}>
                                {column.isPrimaryKey && (
                                  <Key
                                    size={10}
                                    className={styles.primaryKey}
                                  />
                                )}
                                <span>{column.columnName}</span>
                              </div>
                              <div className={styles.fieldType}>
                                <code>{column.rawDataType}</code>
                              </div>
                              <div className={styles.fieldMeta}>
                                <span className={styles.normalizedType}>
                                  {getNormalizedTypeText(column.normalizedType)}
                                </span>
                                {column.nullable && (
                                  <span className={styles.nullableTag}>
                                    nullable
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Table2 size={32} strokeWidth={1.5} />
                    <p>暂无表结构</p>
                  </div>
                )}
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
                  <div className={styles.relationshipTimeline}>
                    {datasource.foreignKeys.map((fk, index) => (
                      <div
                        key={index}
                        className={styles.relationshipNode}
                        style={
                          {
                            "--delay": `${index * 0.05}s`,
                          } as React.CSSProperties
                        }
                      >
                        <div className={styles.relationshipContent}>
                          <div className={styles.relationshipHeader}>
                            <code className={styles.relationshipName}>
                              {fk.fkName}
                            </code>
                          </div>
                          <div className={styles.relationshipFlow}>
                            <div className={styles.flowEndpoint}>
                              <span className={styles.flowTable}>
                                {fk.sourceTableName}
                              </span>
                              <span className={styles.flowColumn}>
                                {fk.sourceColumnName}
                              </span>
                            </div>
                            <div className={styles.flowArrow}>
                              <svg width="20" height="10" viewBox="0 0 32 16">
                                <path
                                  d="M0 8h24M20 4l4 4-4 4"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                />
                              </svg>
                            </div>
                            <div className={styles.flowEndpoint}>
                              <span className={styles.flowTable}>
                                {fk.targetTableName}
                              </span>
                              <span className={styles.flowColumn}>
                                {fk.targetColumnName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </section>
            )}
          </div>
        </main>

    </div>
  );
};
