import { TableStructure } from "./TableStructure";

export const TableStructureExample = () => {
  const columns = [
    {
      columnName: "id",
      rawDataType: "int(11)",
      normalizedType: "number",
      nullable: false,
      isPrimaryKey: true,
    },
    {
      columnName: "name",
      rawDataType: "varchar(255)",
      normalizedType: "string",
      nullable: false,
      isPrimaryKey: false,
    },
    {
      columnName: "email",
      rawDataType: "varchar(255)",
      normalizedType: "string",
      nullable: true,
      isPrimaryKey: false,
    },
    {
      columnName: "created_at",
      rawDataType: "timestamp",
      normalizedType: "datetime",
      nullable: false,
      isPrimaryKey: false,
    },
  ];

  const foreignKeys = [
    {
      fkName: "fk_user_role",
      sourceTableName: "users",
      sourceColumnName: "role_id",
      targetTableName: "roles",
      targetColumnName: "id",
    },
    {
      fkName: "fk_user_department",
      sourceTableName: "users",
      sourceColumnName: "department_id",
      targetTableName: "departments",
      targetColumnName: "id",
    },
  ];

  return (
    <TableStructure
      tableName="users"
      tableComment="用户信息表"
      columns={columns}
      foreignKeys={foreignKeys}
    />
  );
};
