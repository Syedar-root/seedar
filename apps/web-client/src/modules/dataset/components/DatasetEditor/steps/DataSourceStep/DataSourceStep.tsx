import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Check, Key } from "lucide-react";
import { useDatasources } from "#pkg/seedar/ui-react";
import { useDatasetEditorStore } from "../../../../store";
import { Select } from "@/core/components/ui/Select";
import type { DatasetFormData } from "../../../../types/editor.types";
import styles from "./DataSourceStep.module.scss";

interface DataSourceStepProps {
  formData: DatasetFormData;
  onUpdate: (updates: Partial<DatasetFormData>, tag: string) => void;
}

export const DataSourceStep = ({ formData, onUpdate }: DataSourceStepProps) => {
  const { data: datasources } = useDatasources();
  const { datasource: selectedDatasource, fetchDatasource } =
    useDatasetEditorStore();
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<string>(
    formData.datasourceId,
  );
  const [selectedTableNames, setSelectedTableNames] = useState<string[]>(
    formData.tables.map((t) => t.tableName),
  );

  useEffect(() => {
    if (
      selectedDatasourceId &&
      selectedDatasourceId !== formData.datasourceId
    ) {
      onUpdate(
        {
          datasourceId: selectedDatasourceId,
          tables: [],
          mainTable: "",
        },
        "DataSourceStep datasourceId",
      );
      setSelectedTableNames([]);
    }
  }, [selectedDatasourceId]);

  useEffect(() => {
    if (selectedDatasourceId) {
      const id = parseInt(selectedDatasourceId, 10);
      if (id > 0) {
        fetchDatasource(id);
      }
    }
  }, [selectedDatasourceId, fetchDatasource]);

  const tableIdMap = useMemo<Record<string, string>>(
    () =>
      selectedDatasource?.tables?.reduce(
        (acc, cur) => ({
          ...acc,
          [cur.tableName]: String(cur.tableId),
        }),
        {},
      ) || {},
    [selectedDatasource?.tables],
  );

  useEffect(() => {
    if (!tableIdMap || !Object.keys(tableIdMap).length) {
      return;
    }
    const getTableId = (name: string) => tableIdMap[name];
    const newTables = selectedTableNames.map((name) => ({
      tableId: getTableId(name),
      tableName: name,
    }));
    onUpdate({ tables: newTables }, "DataSourceStep tables");

    if (
      formData.mainTable &&
      !selectedTableNames.some((n) => getTableId(n) === formData.mainTable)
    ) {
      onUpdate({ mainTable: "" }, "DataSourceStep mainTable");
    }
  }, [selectedTableNames]);

  const handleTableToggle = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTableNames((prev) => [...prev, tableName]);
    } else {
      setSelectedTableNames((prev) => prev.filter((n) => n !== tableName));
    }
  };

  const handleMainTableChange = (value: string | null) => {
    onUpdate({ mainTable: value || "" }, "DataSourceStep mainTable");
  };

  const datasourceOptions =
    datasources?.map((ds) => ({
      value: ds.id.toString(),
      label: ds.name,
    })) || [];

  const availableTables = selectedDatasource?.tables || [];

  const mainTableOptions = formData.tables.map((t) => ({
    value: t.tableId,
    label: t.tableName,
  }));

  const getDisplayColumns = (
    columns: Array<{
      columnName: string;
      isPrimaryKey?: boolean;
      type?: string;
    }>,
    maxCount = 3,
  ) => {
    const pkColumns = columns.filter((c) => c.isPrimaryKey);
    const otherColumns = columns.filter((c) => !c.isPrimaryKey);
    const displayColumns = [...pkColumns, ...otherColumns].slice(0, maxCount);
    return displayColumns;
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>选择数据源</h3>
        <Select
          value={selectedDatasourceId}
          onChange={(value) => setSelectedDatasourceId(value || "")}
          placeholder="请选择数据源"
          options={datasourceOptions}
          clearable={false}
        />
      </div>

      {selectedDatasourceId && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>选择表</h3>
          <p className={styles.hint}>请选择需要添加到数据集的表</p>
          {availableTables.length > 0 ? (
            <div className={styles.tableGrid}>
              {availableTables.map((table) => {
                const displayColumns = getDisplayColumns(table.columns || []);
                const isSelected = selectedTableNames.includes(table.tableName);

                return (
                  <label
                    key={table.tableName}
                    className={`${styles.tableCard} ${
                      isSelected ? styles.selected : ""
                    }`}
                  >
                    <Checkbox.Root
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleTableToggle(table.tableName, !!checked)
                      }
                      className={styles.checkbox}
                    >
                      <Checkbox.Indicator className={styles.checkboxIndicator}>
                        <Check size={12} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <span className={styles.tableName}>
                          {table.tableName}
                        </span>
                        <span className={styles.columnCount}>
                          {table.columns?.length || 0} 列
                        </span>
                      </div>
                      <div className={styles.cardBody}>
                        {displayColumns.map((col) => (
                          <div
                            key={col.columnName}
                            className={`${styles.fieldItem} ${
                              col.isPrimaryKey ? styles.primaryKey : ""
                            }`}
                          >
                            <span className={styles.fieldName}>
                              {col.columnName}
                            </span>
                            {col.isPrimaryKey && (
                              <Key size={10} className={styles.pkIcon} />
                            )}
                          </div>
                        ))}
                        {(table.columns?.length || 0) > 3 && (
                          <div className={styles.moreFields}>
                            +{(table.columns?.length || 0) - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className={styles.noTables}>该数据源暂没有可用的表</p>
          )}
        </div>
      )}

      {formData.tables.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            选择主表
            <span className={styles.required}>*</span>
          </h3>
          <Select
            value={formData.mainTable}
            onChange={handleMainTableChange}
            placeholder="请选择主表"
            options={mainTableOptions}
            clearable={false}
          />
          <p className={styles.hint}>主表是数据关联的基准表</p>
        </div>
      )}
    </div>
  );
};
