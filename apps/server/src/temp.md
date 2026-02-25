{
"success": true,
"code": "SUCCESS",
"message": "Operation completed successfully",
"data": {
"id": 5,
"name": "用户订单数据集",
"description": "包含用户信息和订单信息的数据集",
"type": "semantic",
"status": "active",
"mainTableId": 5,
"datasource": {
"id": 1,
"name": "test",
"type": "mysql"
},
"mainTable": {
"id": 5,
"tableName": "user",
"datasetName": "用户订单数据集"
},
"tables": [
{
"id": 5,
"datasourceTableId": 29,
"tableName": "user",
"datasetName": "用户订单数据集",
"primaryFieldId": 26
},
{
"id": 6,
"datasourceTableId": 27,
"tableName": "order_main",
"datasetName": "用户订单数据集",
"primaryFieldId": 31
}
],
"fields": [
{
"id": 26,
"name": "user_id",
"alias": null,
"type": "number",
"description": "用户唯一标识",
"businessName": "用户ID",
"isPrimaryKey": true,
"tableId": 5,
"tableName": "user"
},
{
"id": 27,
"name": "user_name",
"alias": null,
"type": "string",
"description": "用户注册姓名",
"businessName": "用户姓名",
"isPrimaryKey": false,
"tableId": 5,
"tableName": "user"
},
{
"id": 28,
"name": "phone",
"alias": null,
"type": "string",
"description": "用户手机号码",
"businessName": "手机号",
"isPrimaryKey": false,
"tableId": 5,
"tableName": "user"
},
{
"id": 29,
"name": "user_level",
"alias": null,
"type": "string",
"description": "用户会员等级",
"businessName": "用户等级",
"isPrimaryKey": false,
"tableId": 5,
"tableName": "user"
},
{
"id": 30,
"name": "register_time",
"alias": null,
"type": "date",
"description": "用户注册时间",
"businessName": "注册时间",
"isPrimaryKey": false,
"tableId": 5,
"tableName": "user"
},
{
"id": 31,
"name": "order_id",
"alias": null,
"type": "number",
"description": "订单唯一标识",
"businessName": "订单ID",
"isPrimaryKey": true,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 32,
"name": "user_id",
"alias": null,
"type": "number",
"description": "下单用户ID",
"businessName": "用户ID",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 33,
"name": "order_time",
"alias": null,
"type": "date",
"description": "订单下单时间",
"businessName": "下单时间",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 35,
"name": "order_status",
"alias": null,
"type": "string",
"description": "订单当前状态",
"businessName": "订单状态",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 36,
"name": "total_amount",
"alias": null,
"type": "number",
"description": "订单总金额",
"businessName": "订单金额",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 37,
"name": "pay_type",
"alias": null,
"type": "string",
"description": "订单支付方式",
"businessName": "支付方式",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
},
{
"id": 38,
"name": "pay_time",
"alias": null,
"type": "date",
"description": "订单支付时间",
"businessName": "支付时间",
"isPrimaryKey": false,
"tableId": 6,
"tableName": "order_main"
}
],
"metrics": [
{
"id": 1,
"name": "order_total_count",
"alias": null,
"description": "订单主表的总订单数量",
"businessName": "订单总数",
"metricType": "aggregate",
"dataSourceColumnId": 151,
"dataSourceColumnName": "order_id",
"aggregateFunction": "count",
"distinct": false,
"aggregateCondition": {},
"leftOperand": null,
"rowOperator": null,
"rightOperand": null,
"sourceMetricId": null,
"leftMetricId": null,
"arithmeticOperator": null,
"rightMetricOperand": null,
"baseMetricId": null,
"timeDataSourceColumnId": null,
"periodType": null,
"calculationMode": null
},
{
"id": 2,
"name": "total_sales_amount",
"alias": "总销售额",
"description": "所有订单的总金额求和",
"businessName": "总销售额",
"metricType": "aggregate",
"dataSourceColumnId": 156,
"dataSourceColumnName": "total_amount",
"aggregateFunction": "sum",
"distinct": false,
"aggregateCondition": {},
"leftOperand": null,
"rowOperator": null,
"rightOperand": null,
"sourceMetricId": null,
"leftMetricId": null,
"arithmeticOperator": null,
"rightMetricOperand": null,
"baseMetricId": null,
"timeDataSourceColumnId": null,
"periodType": null,
"calculationMode": null
},
{
"id": 3,
"name": "user_total_count",
"alias": null,
"description": "用户表的总用户数量",
"businessName": "用户总数",
"metricType": "aggregate",
"dataSourceColumnId": 164,
"dataSourceColumnName": "user_id",
"aggregateFunction": "count",
"distinct": false,
"aggregateCondition": {},
"leftOperand": null,
"rowOperator": null,
"rightOperand": null,
"sourceMetricId": null,
"leftMetricId": null,
"arithmeticOperator": null,
"rightMetricOperand": null,
"baseMetricId": null,
"timeDataSourceColumnId": null,
"periodType": null,
"calculationMode": null
}
]
}
}
