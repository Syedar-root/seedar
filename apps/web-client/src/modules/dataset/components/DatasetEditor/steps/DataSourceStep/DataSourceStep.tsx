import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Check, Key } from "lucide-react";
import { useDatasources } from "#pkg/seedar/ui-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Select } from "@/core/components/ui/Select";
import { useDatasetEditorStore } from "../../../../store";
import type { DatasetFormData } from "../../../../types/editor.types";
import styles from "./DataSourceStep.module.scss";
import clsx from "clsx";

interface DataSourceStepProps {
  formData: DatasetFormData;
  onUpdate: (updates: Partial<DatasetFormData>, tag: string) => void;
}

const TABLE_LIST_MAX_HEIGHT = "min(52vh, 32rem)";

export const DataSourceStep = ({
  formData,
  onUpdate,
}: DataSourceStepProps) => {
  const { data: datasources } = useDatasources();
  const { datasource: selectedDatasource, fetchDatasource } =
    useDatasetEditorStore();
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<string>(
    formData.datasourceId,
  );
  const [selectedTableNames, setSelectedTableNames] = useState<string[]>(
    formData.tables.map((table) => table.tableName),
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
        (accumulator, currentTable) => ({
          ...accumulator,
          [currentTable.tableName]: String(currentTable.tableId),
        }),
        {},
      ) || {},
    [selectedDatasource?.tables],
  );

  useEffect(() => {
    if (!Object.keys(tableIdMap).length) {
      return;
    }

    const getTableId = (tableName: string) => tableIdMap[tableName];
    const tables = selectedTableNames.map((tableName) => ({
      tableId: getTableId(tableName),
      tableName,
    }));

    onUpdate({ tables }, "DataSourceStep tables");

    if (
      formData.mainTable &&
      !selectedTableNames.some(
        (tableName) => getTableId(tableName) === formData.mainTable,
      )
    ) {
      onUpdate({ mainTable: "" }, "DataSourceStep mainTable");
    }
  }, [selectedTableNames]);

  const handleTableToggle = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTableNames((previousTableNames) => [
        ...previousTableNames,
        tableName,
      ]);
      return;
    }

    setSelectedTableNames((previousTableNames) =>
      previousTableNames.filter((name) => name !== tableName),
    );
  };

  const handleMainTableChange = (value: string | null) => {
    onUpdate({ mainTable: value || "" }, "DataSourceStep mainTable");
  };

  const datasourceOptions =
    datasources?.map((datasource) => ({
      value: datasource.id.toString(),
      label: datasource.name,
    })) || [];

  const availableTables = selectedDatasource?.tables || [];

  const mainTableOptions = formData.tables.map((table) => ({
    value: table.tableId,
    label: table.tableName,
  }));

  const getDisplayColumns = (
    columns: Array<{
      columnName: string;
      isPrimaryKey?: boolean;
      type?: string;
    }>,
    maxCount = 3,
  ) => {
    const primaryKeyColumns = columns.filter((column) => column.isPrimaryKey);
    const otherColumns = columns.filter((column) => !column.isPrimaryKey);
    return [...primaryKeyColumns, ...otherColumns].slice(0, maxCount);
  };

  return (
    <div className={styles.container}>
      <div className={clsx(styles.section)}>
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
        <div className={clsx(styles.section, styles.tableList)}>
          <h3 className={styles.sectionTitle}>选择表</h3>
          <p className={styles.hint}>请选择需要添加到数据集的表</p>

          {availableTables.length > 0 ? (
            <ScrollArea>
              <div className={styles.tableGrid}>
                {availableTables.map((table) => {
                  const displayColumns = getDisplayColumns(table.columns || []);
                  const isSelected = selectedTableNames.includes(
                    table.tableName,
                  );

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
                          {displayColumns.map((column) => (
                            <div
                              key={column.columnName}
                              className={`${styles.fieldItem} ${
                                column.isPrimaryKey ? styles.primaryKey : ""
                              }`}
                            >
                              <span className={styles.fieldName}>
                                {column.columnName}
                              </span>
                              {column.isPrimaryKey && (
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
            </ScrollArea>
          ) : (
            <p className={styles.noTables}>该数据源暂无可用的表</p>
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
