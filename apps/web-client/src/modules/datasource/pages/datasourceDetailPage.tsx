import { useParams, useNavigate } from "react-router-dom";
import { useDatasource } from "#pkg/seedar/ui-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import {
  Database,
  Table,
  Key,
  AlertCircle,
  Loader2,
  ArrowLeft,
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
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/datasource")}
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className={styles.title}>{datasource.name}</h1>
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              datasource.status,
            )}`}
          >
            {getStatusText(datasource.status)}
          </span>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Database size={18} />
            基本信息
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>名称：</span>
              <span className={styles.infoValue}>{datasource.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>类型：</span>
              <span className={styles.infoValue}>{datasource.type}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>状态：</span>
              <span className={styles.infoValue}>
                {getStatusText(datasource.status)}
              </span>
            </div>
            {datasource.lastValidateAt && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>最后验证：</span>
                <span className={styles.infoValue}>
                  {new Date(datasource.lastValidateAt).toLocaleString("zh-CN")}
                </span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>创建时间：</span>
              <span className={styles.infoValue}>
                {new Date(datasource.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>更新时间：</span>
              <span className={styles.infoValue}>
                {new Date(datasource.updatedAt).toLocaleString("zh-CN")}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Table size={18} />
            表结构
          </h2>
          <ScrollArea className={styles.scrollArea}>
            <div className={styles.tableList}>
              {datasource.tables && datasource.tables.length > 0 ? (
                datasource.tables.map((table, index) => (
                  <div key={index} className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                      <h3 className={styles.tableName}>{table.tableName}</h3>
                      <span className={styles.columnCount}>
                        {table.columns.length} 列
                      </span>
                    </div>
                    <div className={styles.columnList}>
                      {table.columns.map((column, colIndex) => (
                        <div key={colIndex} className={styles.columnItem}>
                          <div className={styles.columnInfo}>
                            {column.isPrimaryKey && (
                              <Key
                                size={14}
                                className={styles.primaryKeyIcon}
                              />
                            )}
                            <span className={styles.columnName}>
                              {column.columnName}
                            </span>
                          </div>
                          <span className={styles.columnType}>
                            {column.rawDataType}
                          </span>
                          <span className={styles.normalizedType}>
                            ({getNormalizedTypeText(column.normalizedType)})
                          </span>
                          {column.nullable && (
                            <span className={styles.nullableBadge}>可空</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyTables}>
                  <Table size={32} className={styles.emptyTablesIcon} />
                  <p className={styles.emptyTablesText}>暂无表结构</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </section>

        {datasource.foreignKeys && datasource.foreignKeys.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Key size={18} />
              外键关系
            </h2>
            <ScrollArea className={styles.scrollArea}>
              <div className={styles.foreignKeyList}>
                {datasource.foreignKeys.map((fk, index) => (
                  <div key={index} className={styles.foreignKeyItem}>
                    <div className={styles.foreignKeyInfo}>
                      <span className={styles.foreignKeyName}>{fk.fkName}</span>
                      <div className={styles.foreignKeyRelation}>
                        <span className={styles.relationTable}>
                          {fk.sourceTableName}
                        </span>
                        <span className={styles.relationArrow}>→</span>
                        <span className={styles.relationTable}>
                          {fk.targetTableName}
                        </span>
                      </div>
                      <div className={styles.foreignKeyColumns}>
                        <span className={styles.columnPair}>
                          {fk.sourceColumnName} → {fk.targetColumnName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}
      </main>
    </div>
  );
};
