import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Check, Key, Search } from "lucide-react";
import clsx from "clsx";
import { useDatasources } from "#pkg/seedar/ui-react";
import { HelpTip } from "@/core/components/ui/HelpTip";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Select } from "@/core/components/ui/Select";
import { useDatasetEditorStore } from "../../../../store";
import type { DatasetFormData } from "../../../../types/editor.types";
import styles from "./DataSourceStep.module.scss";

interface DataSourceStepProps {
  formData: DatasetFormData;
  onUpdate: (updates: Partial<DatasetFormData>, tag: string) => void;
}

// 表列表最大高度（这个暂时不用）
// const TABLE_LIST_MAX_HEIGHT = "min(52vh, 32rem)";

const MAIN_TABLE_HELP_TEXT =
  "默认入口表是查询时的兜底入口。当系统无法根据本次查询自动推断入口表时，会使用这里的表作为查询起点，因此需要提前指定。";

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
  const [tableSearchKeyword, setTableSearchKeyword] = useState("");
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
      setTableSearchKeyword("");
    }
  }, [formData.datasourceId, onUpdate, selectedDatasourceId]);

  useEffect(() => {
    if (!selectedDatasourceId) {
      return;
    }

    const id = parseInt(selectedDatasourceId, 10);
    if (id > 0) {
      fetchDatasource(id);
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
  }, [formData.mainTable, onUpdate, selectedTableNames, tableIdMap]);

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
  const normalizedTableSearchKeyword = tableSearchKeyword.trim().toLowerCase();
  const filteredTables = useMemo(
    () =>
      !normalizedTableSearchKeyword
        ? availableTables
        : availableTables.filter((table) =>
            table.tableName
              .toLowerCase()
              .includes(normalizedTableSearchKeyword),
          ),
    [availableTables, normalizedTableSearchKeyword],
  );

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
            <>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  value={tableSearchKeyword}
                  onChange={(event) => setTableSearchKeyword(event.target.value)}
                  placeholder="搜索表名"
                  aria-label="搜索表名"
                  className={styles.searchInput}
                />
              </div>

              <ScrollArea>
                {filteredTables.length > 0 ? (
                  <div className={styles.tableGrid}>
                    {filteredTables.map((table) => {
                      const displayColumns = getDisplayColumns(
                        table.columns || [],
                      );
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
                            <Checkbox.Indicator
                              className={styles.checkboxIndicator}
                            >
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
                                    column.isPrimaryKey
                                      ? styles.primaryKey
                                      : ""
                                  }`}
                                >
                                  <span className={styles.fieldName}>
                                    {column.columnName}
                                  </span>
                                  {column.isPrimaryKey && (
                                    <Key
                                      size={10}
                                      className={styles.pkIcon}
                                    />
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
                  <p className={styles.noTables}>未找到匹配的表</p>
                )}
              </ScrollArea>
            </>
          ) : (
            <p className={styles.noTables}>该数据源暂无可用的表</p>
          )}
        </div>
      )}

      {formData.tables.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            选择默认入口表
            <span className={styles.required}>*</span>
            <HelpTip content={MAIN_TABLE_HELP_TEXT} />
          </h3>
          <Select
            value={formData.mainTable}
            onChange={handleMainTableChange}
            placeholder="请选择默认入口表"
            options={mainTableOptions}
            clearable={false}
          />
          <p className={styles.hint}>
            默认入口表会作为系统自动判定失败时的查询兜底入口。
          </p>
        </div>
      )}
    </div>
  );
};
