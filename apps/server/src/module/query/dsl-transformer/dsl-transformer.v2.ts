import {
  FieldRefExpr,
  ComparisonExpr,
  LiteralExpr,
  AggExpr,
  BinaryExpr,
  CallExpr,
  AggFuncName,
  BinaryOperator,
  ComparisonOperator,
  Expr,
  MetricRefExpr,
  ConditionalExpr,
  SelectExpr,
  parseExpression,
  InExpr,
  BetweenExpr,
  LikeExpr,
  IsNullExpr,
  PeriodComparisonExpr,
  ComparisonMode,
  PeriodOffsetType,
} from '@metric-engine/core';
import {
  DatasetResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
  DatasetMetricResponse,
  DatasetJoinResponse,
  MetricType,
  MetricAggregateFunction,
  PeriodCalculationMode,
  PeriodOverPeriodType,
} from '@/module/dataset/dataset.types';
import { QuerySpec, JoinSpec } from '@metric-engine/core';
import { Operator, TimeFilter, TimeRange } from '@metric-engine/core';

/**
 * 查询DSL接口定义
 *
 * 核心改进：移除了joins字段，由后端根据查询需求动态计算
 *
 * @property datasetId - 数据集ID
 * @property tableId - 主表ID
 * @property dimensions - 维度字段列表（字段ID或带别名的字段对象）
 * @property metrics - 指标列表（指标ID或带别名的指标对象）
 * @property filters - 过滤条件列表
 * @property limit - 返回记录数限制
 * @property offset - 分页偏移量
 */
export interface QueryDSL {
  datasetId: number;
  tableId: number;
  dimensions?: QueryDimensionDSL[];
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  tempMetrics?: Array<{
    id: string;
    type?: 'period_comparison';
    alias?: string;
    businessName?: string;
    baseMetricId: number;
    timeFieldId?: number;
    periodType?: PeriodOverPeriodType;
    calculationMode?: PeriodCalculationMode;
  }>;
  orderBy?: QueryOrderByDSL[];
  limit?: number;
  offset?: number;
}

export type QueryOrderDirection = 'asc' | 'desc';

export type QueryOrderByDSL = {
  fieldId?: number;
  metricId?: number;
  tempMetricId?: string;
  alias?: string;
  field?: string;
  dir?: QueryOrderDirection;
  direction?: QueryOrderDirection;
};

export type TimeGrain = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type BaseDimensionDSL = {
  fieldId: number;
  alias?: string;
  derivedKind?: undefined;
};

export type TimeGrainDimensionDSL = {
  derivedKind: 'time_grain';
  fieldId: number;
  grain: TimeGrain;
  alias: string;
};

export type BucketRangeDSL = {
  lt: number;
  label: string;
};

export type BucketDimensionDSL = {
  derivedKind: 'bucket';
  fieldId: number;
  ranges: BucketRangeDSL[];
  defaultLabel?: string;
  alias: string;
};

export type MappingRuleDSL = {
  in: Array<string | number | boolean>;
  label: string;
};

export type MappingDimensionDSL = {
  derivedKind: 'mapping';
  fieldId: number;
  rules: MappingRuleDSL[];
  defaultLabel?: string;
  alias: string;
};

export type ExpressionDimensionDSL = {
  derivedKind: 'expression';
  expression: string;
  alias: string;
};

export type DerivedDimensionDSL =
  | TimeGrainDimensionDSL
  | BucketDimensionDSL
  | MappingDimensionDSL
  | ExpressionDimensionDSL;

export type QueryDimensionDSL = number | BaseDimensionDSL | DerivedDimensionDSL;

/**
 * DSL转换器V2版本
 *
 * 核心功能：将前端DSL转换为metric-engine可执行的QuerySpec
 *
 * ## 核心改进：动态Join选择
 *
 * ### 问题背景
 * 旧版本：前端需要在DSL中指定joins字段，告诉后端需要join哪些表
 * 问题：
 * 1. 前端需要了解表之间的关联关系，增加前端复杂度
 * 2. 可能指定不必要的join，影响查询性能
 * 3. join关系应该由后端dataset配置决定，不应该由前端控制
 *
 * ### 解决方案
 * 新版本：后端根据查询需求自动计算需要的joins
 *
 * ### 实现步骤
 *
 * **Step 1: 收集依赖表ID**
 * - 从dimensions、metrics、filters中收集所有字段所属的表ID
 * - 递归收集指标依赖的表ID（指标可能引用其他指标）
 * - 结果：requiredTableIds集合，包含查询需要的所有表ID
 *
 * **Step 2: 构建Join图**
 * - 根据dataset中的joins配置，构建表之间的连接关系图
 * - 图结构：Map<tableId, Set<{joinId, targetTableId}>>
 * - 这是一个无向图，每个表节点记录了可以通过哪些join到达其他表
 *
 * **Step 3: 查找Join路径**
 * - 使用BFS（广度优先搜索）算法，从主表出发
 * - 找到到达所有requiredTableIds的最短路径
 * - 收集路径上的所有join ID
 * - 结果：requiredJoinIds数组，包含需要的所有join ID
 *
 * **Step 4: 生成Joins**
 * - 根据requiredJoinIds生成JoinSpec对象
 * - 为每个join的右表分配别名（t2, t3, t4...）
 * - 构建join条件表达式
 * - 结果：joins数组，包含所有需要的join配置
 *
 * **Step 5: 构建查询表达式**
 * - 现在tableAliasMap已经完整，可以正确解析字段和指标
 * - 构建dimensions、metrics、filters的Expr对象
 * - 返回完整的QuerySpec
 *
 * ### 关键优势
 * 1. 前端简化：前端只需关注查询什么数据，不需要知道表关联关系
 * 2. 自动优化：只join必要的表，避免不必要的join
 * 3. 正确性保证：BFS确保最短路径，避免循环依赖
 * 4. 可维护性：join逻辑集中在后端，便于维护和优化
 */
export class DSLTransformerV2 {
  /**
   * 转换DSL为QuerySpec
   *
   * @param dsl - 前端传入的查询DSL
   * @param datasetInfo - 数据集配置信息（包含表、字段、指标、join配置）
   * @param tables - 数据库表对象列表（来自schema inspector）
   * @returns QuerySpec - metric-engine可执行的查询规格
   */
  static transform(
    dsl: QueryDSL,
    datasetInfo: DatasetResponse,
    tables: any[],
  ): QuerySpec {
    if (!dsl || !dsl.tableId) {
      throw new Error('DSL必须包含tableId字段');
    }

    // ========================================================================
    // 第一阶段：初始化数据结构
    // ========================================================================
    // 目的：将dataset配置转换为Map结构，便于快速查找
    // 输入：datasetInfo中的tables、fields、metrics、joins数组
    // 输出：tableMap、fieldMap、metricMap、joinMap四个Map对象

    const tableMap = new Map<number, DatasetTableResponse>();
    const fieldMap = new Map<number, DatasetFieldResponse>();
    const fieldMapWithDCId = new Map<number, DatasetFieldResponse>();
    const metricMap = new Map<number, DatasetMetricResponse>();
    const joinMap = new Map<number, DatasetJoinResponse>();

    (datasetInfo.tables || []).forEach((table: DatasetTableResponse) => {
      tableMap.set(table.id, table);
    });

    (datasetInfo.fields || []).forEach((field: DatasetFieldResponse) => {
      fieldMap.set(field.id, field);
      if (field.datasourceColumnId) {
        fieldMapWithDCId.set(field.datasourceColumnId, field);
      }
    });

    (datasetInfo.metrics || []).forEach((metric: DatasetMetricResponse) => {
      metricMap.set(metric.id, metric);
    });
    const metricIdByName = new Map<string, number>(
      (datasetInfo.metrics || []).map((metric: DatasetMetricResponse) => [
        metric.name,
        metric.id,
      ]),
    );

    (datasetInfo.joins || []).forEach((join: DatasetJoinResponse) => {
      joinMap.set(join.id, join);
    });

    // 验证主表是否存在
    const mainTableInfo = tableMap.get(dsl.tableId);
    if (!mainTableInfo) {
      throw new Error(`找不到主表: ${dsl.tableId}`);
    }

    const mainTable = tables.find((t) => t.name === mainTableInfo.tableName);
    if (!mainTable) {
      throw new Error(`找不到主表: ${mainTableInfo.tableName}`);
    }

    console.log('表map:', tableMap);

    const mainTableAlias = 't1';

    const extractExpressionRefs = (
      expression: string,
    ): { fieldIds: number[]; metricIds: number[] } => {
      const fieldIds: number[] = [];
      const metricIds: number[] = [];

      const collectIds = (source: string, pattern: RegExp): number[] => {
        const collected: number[] = [];
        let localMatch: RegExpExecArray | null;
        while ((localMatch = pattern.exec(source)) !== null) {
          const ids = localMatch[1]
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
          collected.push(...ids);
        }
        return collected;
      };

      fieldIds.push(...collectIds(expression, /#F(\d+(?:,\d+)*)/g));
      metricIds.push(...collectIds(expression, /#M(\d+(?:,\d+)*)/g));

      return {
        fieldIds: Array.from(new Set(fieldIds)),
        metricIds: Array.from(new Set(metricIds)),
      };
    };

    const tempMetrics = dsl.tempMetrics || [];

    const periodTypeToOffsetType = (
      periodType?: PeriodOverPeriodType,
    ): PeriodOffsetType => {
      switch (periodType) {
        case PeriodOverPeriodType.DAY_OVER_DAY:
          return PeriodOffsetType.DAY_OVER_DAY;
        case PeriodOverPeriodType.WEEK_OVER_WEEK:
          return PeriodOffsetType.WEEK_OVER_WEEK;
        case PeriodOverPeriodType.QUARTER_OVER_QUARTER:
          return PeriodOffsetType.QUARTER_OVER_QUARTER;
        case PeriodOverPeriodType.YEAR_OVER_YEAR:
          return PeriodOffsetType.YEAR_OVER_YEAR;
        case PeriodOverPeriodType.MONTH_OVER_MONTH:
        default:
          return PeriodOffsetType.MONTH_OVER_MONTH;
      }
    };

    // ========================================================================
    // 第二阶段：收集依赖表ID
    // ========================================================================
    // 目的：确定查询需要涉及哪些表
    // 输入：DSL中的dimensions、metrics、filters
    // 输出：requiredTableIds集合，包含所有需要的表ID
    //
    // 为什么需要这个阶段？
    // 因为joins的生成依赖于需要查询的表，我们需要先知道查询涉及哪些表，
    // 然后才能计算需要哪些joins来连接这些表。

    const requiredTableIds = new Set<number>();
    requiredTableIds.add(dsl.tableId); // 主表总是需要的

    /**
     * 收集字段所属的表ID
     *
     * @param fieldId - 字段ID
     * 效果：将字段所属的表ID添加到requiredTableIds集合
     */
    const collectFieldTableId = (fieldId: number) => {
      const fieldInfo = fieldMap.get(fieldId);
      if (!fieldInfo) {
        throw new Error(`找不到字段: ${fieldId}`);
      }
      const tableInfo = tableMap.get(fieldInfo.tableId);
      if (!tableInfo) {
        throw new Error(`找不到字段所属表: ${fieldInfo.tableId}`);
      }
      requiredTableIds.add(tableInfo.id);
    };

    /**
     * 递归收集指标依赖的表ID
     *
     * @param metricId - 指标ID
     * @param visited - 已访问的指标ID集合，防止循环引用
     * 效果：将指标依赖的所有表ID添加到requiredTableIds集合
     *
     * 处理逻辑：
     * 1. 如果指标有expression字段，解析表达式中的#F和#M引用
     * 2. 如果指标是AGGREGATE类型，收集聚合字段所属的表
     * 3. 如果指标是ROW_LEVEL类型，收集左右操作数字段所属的表
     * 4. 如果指标是POST_AGGREGATE类型，递归收集源指标的表依赖
     * 5. 如果指标是ARITHMETIC类型，递归收集左右指标的表依赖
     */
    const collectMetricTableIds = (
      metricId: number,
      visited: Set<number> = new Set(),
    ) => {
      if (visited.has(metricId)) {
        return;
      }
      visited.add(metricId);

      const metric = metricMap.get(metricId);
      if (!metric) {
        throw new Error(`找不到指标: ${metricId}`);
      }

      if (metric.expression) {
        const { fieldIds, metricIds } = extractExpressionRefs(
          metric.expression,
        );
        fieldIds.forEach((fieldId) => collectFieldTableId(fieldId));
        metricIds.forEach((refMetricId) =>
          collectMetricTableIds(refMetricId, visited),
        );
        return;
      }

      if (metric.expression) {
        // 解析表达式中的字段引用 #F(\d+)
        const fieldIdPattern = /#F(\d+)/g;
        let match;
        while ((match = fieldIdPattern.exec(metric.expression)) !== null) {
          const fieldId = parseInt(match[1], 10);
          collectFieldTableId(fieldId);
        }

        // 解析表达式中的指标引用 #M(\d+)
        const metricIdPattern = /#M(\d+)/g;
        while ((match = metricIdPattern.exec(metric.expression)) !== null) {
          const refMetricId = parseInt(match[1], 10);
          collectMetricTableIds(refMetricId, visited);
        }
      } else {
        // 根据指标类型处理
        switch (metric.metricType) {
          case MetricType.AGGREGATE:
            // 聚合指标：收集聚合字段所属的表
            if (metric.dataSourceColumnId) {
              const fieldInfo = Array.from(fieldMap.values()).find(
                (f) => f.datasourceColumnId === metric.dataSourceColumnId,
              );
              if (fieldInfo) {
                collectFieldTableId(fieldInfo.id);
              }
            }
            break;
          case MetricType.ROW_LEVEL:
            // 行级指标：收集左右操作数字段所属的表
            if (metric.leftOperand) collectFieldTableId(metric.leftOperand);
            if (metric.rightOperand) collectFieldTableId(metric.rightOperand);
            break;
          case MetricType.POST_AGGREGATE:
            // 后聚合指标：递归收集源指标的表依赖
            if (metric.sourceMetricId) {
              collectMetricTableIds(metric.sourceMetricId, visited);
            }
            break;
          case MetricType.ARITHMETIC:
            // 算术指标：递归收集左右指标的表依赖
            if (metric.leftMetricId) {
              collectMetricTableIds(metric.leftMetricId, visited);
            }
            if (metric.rightMetricOperandFieldName) {
              collectMetricTableIds(metric.rightMetricOperand!, visited);
            }
            break;
        }
      }
    };

    const collectDimensionTableIds = (dimension: QueryDimensionDSL) => {
      if (typeof dimension === 'number') {
        collectFieldTableId(dimension);
        return;
      }

      if (dimension.derivedKind === undefined) {
        collectFieldTableId(dimension.fieldId);
        return;
      }

      if (!dimension.alias?.trim()) {
        throw new Error(
          `dimensions 中 derivedKind=${dimension.derivedKind} 的维度必须提供 alias`,
        );
      }

      switch (dimension.derivedKind) {
        case 'time_grain':
        case 'bucket':
        case 'mapping':
          collectFieldTableId(dimension.fieldId);
          return;
        case 'expression': {
          const refs = extractExpressionRefs(dimension.expression);
          if (refs.metricIds.length > 0) {
            throw new Error(
              `derivedKind=expression 维度不支持 #M 指标引用: ${refs.metricIds.join(', ')}`,
            );
          }
          refs.fieldIds.forEach((fieldId) => collectFieldTableId(fieldId));
          return;
        }
        default:
          throw new Error(
            `不支持的 derivedKind: ${(dimension as { derivedKind: string }).derivedKind}`,
          );
      }
    };

    // 收集dimensions中的表依赖
    (dsl.dimensions || []).forEach((dim) => {
      collectDimensionTableIds(dim);
    });

    // 收集metrics中的表依赖
    (dsl.metrics || []).forEach((metricItem) => {
      collectMetricTableIds(metricItem.id);
    });

    tempMetrics.forEach((tempMetric) => {
      collectMetricTableIds(tempMetric.baseMetricId);
      const baseMetricInfo = metricMap.get(tempMetric.baseMetricId);
      const effectiveTimeFieldId =
        tempMetric.timeFieldId ?? baseMetricInfo?.timeFieldId;

      if (!effectiveTimeFieldId) {
        throw new Error(
          `临时周期指标 ${tempMetric.id} 需要 timeFieldId 或基础指标的默认 timeFieldId。`,
        );
      }

      collectFieldTableId(effectiveTimeFieldId);
    });

    // 收集filters中的表依赖
    (dsl.filters || []).forEach((filter) => {
      collectFieldTableId(filter.fieldId);
    });

    // ========================================================================
    // 第三阶段：构建Join图并查找Join路径
    // ========================================================================
    // 目的：计算从主表到所有依赖表的最短join路径
    // 输入：joinMap（dataset中的join配置）、requiredTableIds（需要的表ID）
    // 输出：requiredJoinIds（需要的join ID列表）
    //
    // 为什么使用BFS？
    // 1. BFS保证找到最短路径，避免不必要的join
    // 2. BFS天然适合无权图的最短路径问题
    // 3. BFS可以处理多个目标节点（我们需要到达多个表）

    /**
     * 构建Join关系图
     *
     * @returns 无向图，Map<tableId, Set<{joinId, targetTableId}>>
     *
     * 图结构说明：
     * - 节点：表ID
     * - 边：join关系，包含joinId和目标表ID
     * - 无向图：join可以从左到右，也可以从右到左
     *
     * 示例：
     * 假设有3个表：orders(1), customers(2), products(3)
     * join配置：
     * - join1: orders.customer_id = customers.id
     * - join2: orders.product_id = products.id
     *
     * 构建的图：
     * {
     *   1 => Set([{joinId: 1, targetTableId: 2}, {joinId: 2, targetTableId: 3}])
     *   2 => Set([{joinId: 1, targetTableId: 1}])
     *   3 => Set([{joinId: 2, targetTableId: 1}])
     * }
     */
    const buildJoinGraph = (): Map<
      number,
      Set<{ joinId: number; targetTableId: number }>
    > => {
      const graph = new Map<
        number,
        Set<{ joinId: number; targetTableId: number }>
      >();

      joinMap.forEach((join, joinId) => {
        // 添加左表到右表的连接
        if (!graph.has(join.leftTableId)) {
          graph.set(join.leftTableId, new Set());
        }
        graph
          .get(join.leftTableId)!
          .add({ joinId, targetTableId: join.rightTableId });

        // 添加右表到左表的连接（无向图）
        if (!graph.has(join.rightTableId)) {
          graph.set(join.rightTableId, new Set());
        }
        graph
          .get(join.rightTableId)!
          .add({ joinId, targetTableId: join.leftTableId });
      });

      return graph;
    };

    /**
     * 使用BFS查找Join路径
     *
     * @param startTableId - 起始表ID（主表）
     * @param targetTableIds - 目标表ID集合
     * @returns 需要的join ID数组
     *
     * 算法流程：
     * 1. 从主表开始BFS遍历
     * 2. 记录到达每个表的路径（经过的join ID）
     * 3. 如果到达的表在targetTableIds中，记录路径上的所有join
     * 4. 继续遍历直到所有目标表都被访问
     *
     * 为什么这样设计？
     * - BFS保证最短路径：先访问到的表一定是通过最少join到达的
     * - 路径记录：每个节点记录到达它的路径，避免回溯
     * - 多目标：可以同时找到到达多个目标表的路径
     */
    const findJoinPath = (
      startTableId: number,
      targetTableIds: Set<number>,
    ): number[] => {
      const joinGraph = buildJoinGraph();
      const visited = new Set<number>();
      const queue: Array<{ tableId: number; path: number[] }> = [
        { tableId: startTableId, path: [] },
      ];
      const requiredJoins = new Set<number>();

      while (queue.length > 0) {
        const { tableId, path } = queue.shift()!;

        if (visited.has(tableId)) {
          continue;
        }
        visited.add(tableId);

        console.log('targetTableIds:', targetTableIds);

        // 如果当前表是目标表之一，记录路径上的所有join
        if (targetTableIds.has(tableId)) {
          path.forEach((joinId) => requiredJoins.add(joinId));
        }

        // 遍历邻居节点（可以通过join到达的表）
        const neighbors = joinGraph.get(tableId) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.targetTableId)) {
            queue.push({
              tableId: neighbor.targetTableId,
              path: [...path, neighbor.joinId],
            });
          }
        }
      }

      return Array.from(requiredJoins);
    };

    // ========================================================================
    // 第四阶段：生成Joins并分配表别名
    // ========================================================================
    // 目的：根据join路径生成JoinSpec对象，并为每个表分配别名
    // 输入：requiredJoinIds（需要的join ID列表）
    // 输出：joins数组（JoinSpec对象）、tableAliasMap（表ID到别名的映射）
    //
    // 关键点：
    // 1. tableAliasMap必须在构建Expr之前完成，因为构建Expr时需要知道表别名
    // 2. 主表别名固定为't1'，join的表依次为't2', 't3', 't4'...
    // 3. join的顺序很重要，必须确保左表的别名已经分配

    const tableAliasMap = new Map<number, string>();
    tableAliasMap.set(dsl.tableId, mainTableAlias);

    const requiredJoinIds = findJoinPath(dsl.tableId, requiredTableIds);

    const joins: JoinSpec[] = [];
    let joinAliasIdx = 2;

    console.log('requiredJoinIds:', requiredJoinIds);

    // 遍历需要的join ID，生成JoinSpec对象
    for (const joinId of requiredJoinIds) {
      const joinInfo = joinMap.get(joinId);
      if (!joinInfo) {
        throw new Error(`找不到连接: ${joinId}`);
      }

      const rightTableInfo = tableMap.get(joinInfo.rightTableId);
      if (!rightTableInfo) {
        throw new Error(`找不到右表: ${joinInfo.rightTableId}`);
      }

      const rightTable = tables.find(
        (t) => t.name === rightTableInfo.tableName,
      );
      if (!rightTable) {
        throw new Error(`找不到JOIN表: ${rightTableInfo.tableName}`);
      }

      // 为右表分配别名
      const rightTableAlias = `t${joinAliasIdx++}`;
      tableAliasMap.set(joinInfo.rightTableId, rightTableAlias);

      // 获取join条件中的字段信息
      const leftFieldInfo = fieldMapWithDCId.get(Number(joinInfo.leftField));
      const rightFieldInfo = fieldMapWithDCId.get(Number(joinInfo.rightField));

      // 获取左表别名（应该已经分配过了）
      const leftTableAlias =
        tableAliasMap.get(joinInfo.leftTableId) || mainTableAlias;

      // 构建join条件表达式：leftField = rightField
      const onExpr = new ComparisonExpr(
        Operator.EQUALS,
        new FieldRefExpr(leftFieldInfo?.name || '', undefined, leftTableAlias),
        new FieldRefExpr(
          rightFieldInfo?.name || '',
          undefined,
          rightTableAlias,
        ),
      );

      // 添加到joins数组
      joins.push({
        type: (joinInfo.joinType || 'inner') as any,
        table: rightTableInfo.tableName,
        alias: rightTableAlias,
        on: onExpr,
      });
    }

    console.log('tableAliasMap:', tableAliasMap);

    /**
     * 获取表别名
     *
     * @param tableId - 表ID
     * @returns 表别名（t1, t2, t3...）
     * @throws 如果表ID不在tableAliasMap中
     *
     * 注意：此函数只能在joins生成后使用
     */
    const getTableAlias = (tableId: number): string => {
      if (tableAliasMap.has(tableId)) {
        return tableAliasMap.get(tableId)!;
      }
      throw new Error(`找不到表 ${tableId} 对应的别名`);
    };

    // ========================================================================
    // 第五阶段：构建查询表达式
    // ========================================================================
    // 目的：构建dimensions、metrics、filters的Expr对象
    // 输入：DSL中的dimensions、metrics、filters
    // 输出：dimensions数组、metrics数组、filters数组
    //
    // 关键点：
    // 1. 现在tableAliasMap已经完整，可以正确解析字段和指标
    // 2. 需要处理各种类型的指标（AGGREGATE、ROW_LEVEL、POST_AGGREGATE、ARITHMETIC）
    // 3. 需要处理表达式类型的指标（使用V2的ExprParser）

    /**
     * 解析字段引用
     *
     * @param fieldId - 字段ID
     * @param defaultTableAlias - 默认表别名（可选）
     * @returns FieldRefExpr对象
     *
     * 处理逻辑：
     * 1. 从fieldMap中获取字段信息
     * 2. 从tableMap中获取表信息
     * 3. 从tableAliasMap中获取表别名
     * 4. 构建FieldRefExpr对象
     */
    const resolveField = (
      fieldId: number,
      defaultTableAlias?: string,
    ): FieldRefExpr => {
      const fieldInfo = fieldMap.get(fieldId);
      if (!fieldInfo) {
        throw new Error(`找不到字段: ${fieldId}`);
      }

      const tableInfo = tableMap.get(fieldInfo.tableId);
      if (!tableInfo) {
        throw new Error(`找不到字段所属表: ${fieldInfo.tableId}`);
      }

      requiredTableIds.add(tableInfo.id);

      let tableAlias = defaultTableAlias;
      if (!tableAlias) {
        tableAlias = getTableAlias(tableInfo.id);
      }

      return new FieldRefExpr(
        fieldInfo.name,
        undefined,
        tableAlias || mainTableAlias,
        {
          alias: undefined,
          businessName: fieldInfo.businessName || fieldInfo.name,
          description: fieldInfo.description,
        },
      );
    };

    /**
     * 预处理表达式：将 #F 和 #M 替换为实际字段/指标名
     * #F100,200,300 表示字段ID列表
     * #M100,200 表示指标ID列表
     */
    const preprocessExpression = (expression: string): string => {
      let result = expression;

      console.log('原始表达式:', expression);

      // 先替换 #M 指标引用
      result = result.replace(/#M(\d+(?:,\d+)*)/g, (_match, ids) => {
        const idList = ids
          .split(',')
          .map((id: string) => parseInt(id, 10))
          .filter((id: number) => !Number.isNaN(id));
        return idList
          .map((id) => {
            const metricInfo = metricMap.get(id);
            if (!metricInfo) {
              throw new Error(`找不到指标: ${id}`);
            }
            return metricInfo.name;
          })
          .join(', ');
      });

      // 再替换 #F 字段引用
      result = result.replace(/#F(\d+(?:,\d+)*)/g, (_match, ids) => {
        const idList = ids
          .split(',')
          .map((id: string) => parseInt(id, 10))
          .filter((id: number) => !Number.isNaN(id));
        return idList
          .map((id) => {
            const fieldInfo = fieldMap.get(id);
            if (!fieldInfo) {
              throw new Error(`找不到字段: ${id}`);
            }
            const tableAlias = getTableAlias(fieldInfo.tableId);
            return `${tableAlias}.${fieldInfo.name}`;
          })
          .join(', ');
      });

      return result;
    };

    const buildBucketDimensionExpr = (
      fieldExpr: FieldRefExpr,
      ranges: BucketRangeDSL[],
      defaultLabel?: string,
    ): Expr => {
      let branch: Expr = new LiteralExpr(defaultLabel ?? null);

      for (let i = ranges.length - 1; i >= 0; i -= 1) {
        const currentRange = ranges[i];
        branch = new ConditionalExpr(
          new ComparisonExpr('<', fieldExpr, new LiteralExpr(currentRange.lt)),
          new LiteralExpr(currentRange.label),
          branch,
        );
      }

      return branch;
    };

    const buildMappingDimensionExpr = (
      fieldExpr: FieldRefExpr,
      rules: MappingRuleDSL[],
      defaultLabel?: string,
    ): Expr => {
      let branch: Expr = new LiteralExpr(defaultLabel ?? null);
      const flattenedRules = rules.flatMap((rule) =>
        rule.in.map((value) => ({ value, label: rule.label })),
      );

      for (let i = flattenedRules.length - 1; i >= 0; i -= 1) {
        const currentRule = flattenedRules[i];
        branch = new ConditionalExpr(
          new ComparisonExpr(
            '=',
            fieldExpr,
            new LiteralExpr(currentRule.value),
          ),
          new LiteralExpr(currentRule.label),
          branch,
        );
      }

      return branch;
    };

    const buildExpressionDimensionExpr = (
      dimension: ExpressionDimensionDSL,
    ): Expr => {
      const refs = extractExpressionRefs(dimension.expression);
      if (refs.metricIds.length > 0) {
        throw new Error(
          `derivedKind=expression 维度不支持 #M 指标引用: ${refs.metricIds.join(', ')}`,
        );
      }

      const processedExpr = preprocessExpression(dimension.expression);
      const context = {
        tables: new Map([
          [
            mainTableAlias,
            { name: mainTableInfo.tableName, alias: mainTableAlias },
          ],
        ]),
        fields: new Map(
          Array.from(fieldMap.values())
            .filter((f) => {
              const fieldTableInfo = tableMap.get(f.tableId);
              return fieldTableInfo && requiredTableIds.has(fieldTableInfo.id);
            })
            .map((f) => {
              const fieldTableInfo = tableMap.get(f.tableId);
              const fieldTableAlias = fieldTableInfo
                ? getTableAlias(fieldTableInfo.id)
                : mainTableAlias;
              return [
                f.name,
                {
                  name: f.name,
                  tableName: fieldTableInfo?.tableName || '',
                  tableAlias: fieldTableAlias,
                },
              ];
            }),
        ),
        metrics: new Map<string, Expr>(),
        defaultTable: mainTableAlias,
      };

      const expr = parseExpression(processedExpr, context);
      expr.meta = {
        ...(expr.meta || {}),
        alias: dimension.alias,
        businessName: dimension.alias,
      };

      return expr;
    };

    const inlineMetricRefs = (expr: Expr, visited: Set<number>): Expr => {
      if (expr instanceof MetricRefExpr) {
        const metricId = metricIdByName.get(expr.metricName);
        if (!metricId) {
          throw new Error(`找不到指标: ${expr.metricName}`);
        }
        return buildMetricExpr(metricId, new Set(visited));
      }

      if (expr instanceof AggExpr) {
        return new AggExpr(
          expr.functionName,
          inlineMetricRefs(expr.arg, visited),
          expr.distinct,
          expr.meta,
        );
      }

      if (expr instanceof PeriodComparisonExpr) {
        return new PeriodComparisonExpr(
          inlineMetricRefs(expr.baseMetric, visited),
          expr.offsetType,
          expr.comparisonMode,
          expr.timeField,
          expr.customTimeRange,
          expr.meta,
        );
      }

      if (expr instanceof BinaryExpr) {
        return new BinaryExpr(
          expr.operator,
          inlineMetricRefs(expr.left, visited),
          inlineMetricRefs(expr.right, visited),
          expr.meta,
        );
      }

      if (expr instanceof ComparisonExpr) {
        return new ComparisonExpr(
          expr.operator,
          inlineMetricRefs(expr.left, visited),
          inlineMetricRefs(expr.right, visited),
          expr.meta,
        );
      }

      if (expr instanceof ConditionalExpr) {
        return new ConditionalExpr(
          inlineMetricRefs(expr.condition, visited),
          inlineMetricRefs(expr.consequent, visited),
          inlineMetricRefs(expr.alternate, visited),
          expr.meta,
        );
      }

      if (expr instanceof SelectExpr) {
        return new SelectExpr(
          expr.cases.map((caseItem) => ({
            condition: caseItem.condition
              ? inlineMetricRefs(caseItem.condition, visited)
              : undefined,
            value: inlineMetricRefs(caseItem.value, visited),
          })),
          expr.defaultValue
            ? inlineMetricRefs(expr.defaultValue, visited)
            : undefined,
          expr.meta,
        );
      }

      if (expr instanceof CallExpr) {
        return new CallExpr(
          expr.functionName,
          expr.args.map((arg) => inlineMetricRefs(arg, visited)),
          expr.meta,
        );
      }

      if (expr instanceof InExpr) {
        return new InExpr(
          inlineMetricRefs(expr.expr, visited),
          expr.values.map((value) => inlineMetricRefs(value, visited)),
          expr.negated,
          expr.meta,
        );
      }

      if (expr instanceof BetweenExpr) {
        return new BetweenExpr(
          inlineMetricRefs(expr.expr, visited),
          inlineMetricRefs(expr.low, visited),
          inlineMetricRefs(expr.high, visited),
          expr.negated,
          expr.meta,
        );
      }

      if (expr instanceof LikeExpr) {
        return new LikeExpr(
          inlineMetricRefs(expr.expr, visited),
          inlineMetricRefs(expr.pattern, visited),
          expr.negated,
          expr.meta,
        );
      }

      if (expr instanceof IsNullExpr) {
        return new IsNullExpr(
          inlineMetricRefs(expr.expr, visited),
          expr.negated,
          expr.meta,
        );
      }

      return expr;
    };

    const applyCalculationModeOverride = (
      expr: Expr,
      metric: DatasetMetricResponse,
    ): Expr => {
      if (!(expr instanceof PeriodComparisonExpr) || !metric.calculationMode) {
        return expr;
      }

      if (metric.calculationMode === PeriodCalculationMode.BOTH) {
        throw new Error(
          `Metric ${metric.name} uses calculationMode=both, which is not supported in V2.1. Please split it into two metrics.`,
        );
      }

      const comparisonMode =
        metric.calculationMode === PeriodCalculationMode.ABSOLUTE
          ? ComparisonMode.ABSOLUTE
          : ComparisonMode.PERCENTAGE;

      return new PeriodComparisonExpr(
        expr.baseMetric,
        expr.offsetType,
        comparisonMode,
        expr.timeField,
        expr.customTimeRange,
        expr.meta,
      );
    };

    const assertPeriodComparisonFilterSupport = (
      metric: DatasetMetricResponse,
      refs: { fieldIds: number[]; metricIds: number[] },
    ) => {
      if (
        !metric.expression ||
        !/^(MOM|YOY|WOW|QOQ|DOD)\s*\(/i.test(metric.expression.trim())
      ) {
        return;
      }

      if (refs.metricIds.length === 0) {
        throw new Error(
          `Metric ${metric.name} PoP expression must reference at least one #M metric id.`,
        );
      }

      if (refs.fieldIds.length === 0) {
        throw new Error(
          `Metric ${metric.name} PoP expression must reference at least one #F field id.`,
        );
      }

      const [timeFieldId] = refs.fieldIds;
      const hasTimeFilter = (dsl.filters || []).some(
        (filter) =>
          filter.fieldId === timeFieldId &&
          ['recent_days', 'recent_weeks', 'recent_months', 'between'].includes(
            filter.op,
          ),
      );

      if (!hasTimeFilter) {
        throw new Error(
          `Metric ${metric.name} PoP query requires a matching time filter for #F${timeFieldId}.`,
        );
      }
    };

    /**
     * 从表达式构建 Expr AST
     * 使用 V2 的 ExprParser 解析表达式字符串
     *
     * @param metric - 指标配置
     * @param visited - 已访问的指标ID集合，防止循环引用
     * @returns Expr对象
     *
     * 关键点：
     * 1. 只处理requiredTableIds中的表的字段，避免"找不到表"错误
     * 2. 使用parseExpression解析表达式字符串
     * 3. 提供context，包含tables、fields、metrics信息
     */
    const buildExprFromExpression = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): Expr => {
      if (!metric.expression) {
        throw new Error('expression metric 需要 expression 字段');
      }

      visited.add(metric.id);
      const refs = extractExpressionRefs(metric.expression);

      const processedExpr = preprocessExpression(metric.expression);

      const context = {
        tables: new Map([
          [
            mainTableAlias,
            { name: mainTableInfo.tableName, alias: mainTableAlias },
          ],
        ]),
        // 关键：只处理requiredTableIds中的表的字段
        fields: new Map(
          Array.from(fieldMap.values())
            .filter((f) => {
              const fieldTableInfo = tableMap.get(f.tableId);
              // 只包含查询需要的表的字段
              return fieldTableInfo && requiredTableIds.has(fieldTableInfo.id);
            })
            .map((f) => {
              const fieldTableInfo = tableMap.get(f.tableId);
              let fieldTableAlias = mainTableAlias;
              if (fieldTableInfo) {
                fieldTableAlias = getTableAlias(fieldTableInfo.id);
              }
              return [
                f.name,
                {
                  name: f.name,
                  tableName: fieldTableInfo?.tableName || '',
                  tableAlias: fieldTableAlias,
                },
              ];
            }),
        ),
        metrics: new Map(
          (dsl.metrics || []).map((m) => {
            const metricInfo = metricMap.get(m.id);
            if (!metricInfo) {
              throw new Error(`找不到指标: ${m.id}`);
            }
            return [
              metricInfo.name,
              visited.has(m.id)
                ? new MetricRefExpr(metricInfo.name, { alias: metricInfo.name })
                : buildMetricExpr(m.id, visited),
            ];
          }),
        ),
        defaultTable: mainTableAlias,
      };

      context.metrics = new Map(
        refs.metricIds.map((refMetricId) => {
          const metricInfo = metricMap.get(refMetricId);
          if (!metricInfo) {
            throw new Error(`找不到指标: ${refMetricId}`);
          }
          return [
            metricInfo.name,
            new MetricRefExpr(metricInfo.name, { alias: metricInfo.name }),
          ];
        }),
      );

      const parsedExpr = parseExpression(processedExpr, context);
      const inlinedExpr = inlineMetricRefs(parsedExpr, visited);
      const finalExpr = applyCalculationModeOverride(inlinedExpr, metric);
      assertPeriodComparisonFilterSupport(metric, refs);
      return finalExpr;
    };

    /**
     * 递归构建指标表达式（用于 metrics 上下文的引用）
     */
    const buildMetricExpr = (metricId: number, visited: Set<number>): Expr => {
      if (visited.has(metricId)) {
        throw new Error(`检测到循环引用: 指标 ${metricId}`);
      }
      visited.add(metricId);

      const metric = metricMap.get(metricId);
      if (!metric) {
        throw new Error(`找不到指标: ${metricId}`);
      }

      if (metric.expression) {
        return buildExprFromExpression(metric, visited);
      }

      switch (metric.metricType) {
        case MetricType.AGGREGATE:
          return buildAggregateExpr(metric);
        case MetricType.ROW_LEVEL:
          return buildRowLevelExpr(metric);
        case MetricType.POST_AGGREGATE:
          return buildPostAggregateExpr(metric, visited);
        case MetricType.ARITHMETIC:
          return buildArithmeticExpr(metric, visited);
        default:
          return new MetricRefExpr(metric.name, {
            alias: metric.name,
            businessName: metric.businessName,
          });
      }
    };

    const resolveMetric = (
      metricId: number,
      visited: Set<number> = new Set(),
    ): Expr => {
      if (visited.has(metricId)) {
        throw new Error(`检测到循环引用: 指标 ${metricId}`);
      }
      visited.add(metricId);

      const metric = metricMap.get(metricId);
      if (!metric) {
        throw new Error(`找不到指标: ${metricId}`);
      }

      // 如果有 expression 字段，优先使用表达式解析
      if (metric.expression) {
        return buildExprFromExpression(metric, visited);
      }

      switch (metric.metricType) {
        case MetricType.AGGREGATE:
          return buildAggregateExpr(metric);
        case MetricType.ROW_LEVEL:
          return buildRowLevelExpr(metric);
        case MetricType.POST_AGGREGATE:
          return buildPostAggregateExpr(metric, visited);
        case MetricType.ARITHMETIC:
          return buildArithmeticExpr(metric, visited);
        default:
          return new MetricRefExpr(metric.name, {
            alias: metric.name,
            businessName: metric.businessName,
          });
      }
    };

    const buildTempMetricExpr = (
      tempMetric: NonNullable<QueryDSL['tempMetrics']>[number],
    ): PeriodComparisonExpr => {
      if ((tempMetric.type || 'period_comparison') !== 'period_comparison') {
        throw new Error(`不支持的临时指标类型: ${tempMetric.type}`);
      }

      const baseMetricInfo = metricMap.get(tempMetric.baseMetricId);
      if (!baseMetricInfo) {
        throw new Error(`找不到指标: ${tempMetric.baseMetricId}`);
      }

      const effectiveTimeFieldId =
        tempMetric.timeFieldId ?? baseMetricInfo.timeFieldId;
      if (!effectiveTimeFieldId) {
        throw new Error(
          `临时周期指标 ${tempMetric.id} 需要 timeFieldId 或基础指标的默认 timeFieldId。`,
        );
      }

      const hasTimeFilter = (dsl.filters || []).some(
        (filter) =>
          filter.fieldId === effectiveTimeFieldId &&
          ['recent_days', 'recent_weeks', 'recent_months', 'between'].includes(
            filter.op,
          ),
      );
      if (!hasTimeFilter) {
        throw new Error(
          `临时周期指标 ${tempMetric.id} 需要字段 #F${effectiveTimeFieldId} 的匹配时间过滤器。`,
        );
      }

      const calculationMode =
        tempMetric.calculationMode ?? baseMetricInfo.calculationMode;
      if (calculationMode === PeriodCalculationMode.BOTH) {
        throw new Error(
          `临时周期指标 ${tempMetric.id} 使用 calculationMode=both，在 V2.1 中不支持。`,
        );
      }

      const baseExpr = resolveMetric(tempMetric.baseMetricId);
      if (baseExpr instanceof PeriodComparisonExpr) {
        throw new Error(
          `临时周期指标 ${tempMetric.id} 不能使用周期指标作为其基础指标。`,
        );
      }

      const timeFieldExpr = resolveField(effectiveTimeFieldId);
      const comparisonMode =
        calculationMode === PeriodCalculationMode.ABSOLUTE
          ? ComparisonMode.ABSOLUTE
          : ComparisonMode.PERCENTAGE;

      return new PeriodComparisonExpr(
        baseExpr,
        periodTypeToOffsetType(tempMetric.periodType),
        comparisonMode,
        timeFieldExpr,
        undefined,
        {
          alias:
            tempMetric.alias ?? baseMetricInfo.alias ?? baseMetricInfo.name,
          businessName:
            tempMetric.businessName ??
            baseMetricInfo.businessName ??
            baseMetricInfo.name,
        },
      );
    };

    const buildAggregateExpr = (metric: DatasetMetricResponse): AggExpr => {
      const funcMap: Record<string, AggFuncName> = {
        count: 'COUNT' as AggFuncName,
        sum: 'SUM' as AggFuncName,
        avg: 'AVG' as AggFuncName,
        max: 'MAX' as AggFuncName,
        min: 'MIN' as AggFuncName,
        distinct_count: 'COUNT' as AggFuncName,
      };

      const funcName =
        funcMap[metric.aggregateFunction || 'sum'] || ('SUM' as AggFuncName);

      const isDistinct =
        metric.distinct ||
        metric.aggregateFunction === MetricAggregateFunction.DISTINCT_COUNT;

      let baseFieldExpr: FieldRefExpr;
      if (metric.dataSourceColumnId) {
        const fieldInfo = Array.from(fieldMap.values()).find(
          (f) => f.datasourceColumnId === metric.dataSourceColumnId,
        );
        if (!fieldInfo) {
          throw new Error(`找不到指标字段: ${metric.dataSourceColumnId}`);
        }
        baseFieldExpr = resolveField(fieldInfo.id);
      } else {
        baseFieldExpr = new FieldRefExpr('id', undefined, mainTableAlias);
      }

      let fieldExpr: Expr = baseFieldExpr;
      const aggCondition = metric.aggregateCondition;

      if (aggCondition?.caseCondition) {
        const caseWhenExpr = this.parseCaseCondition(
          aggCondition.caseCondition,
          baseFieldExpr,
          fieldMap,
          mainTableAlias,
        );
        fieldExpr = caseWhenExpr;
      }

      return new AggExpr(funcName, fieldExpr, isDistinct, {
        alias: metric.name,
        businessName: metric.businessName,
      });
    };

    const buildRowLevelExpr = (metric: DatasetMetricResponse): BinaryExpr => {
      if (
        !metric.leftOperand ||
        !metric.rowOperator ||
        metric.rightOperand === undefined
      ) {
        throw new Error(
          'row_level metric需要leftOperand/rowOperator/rightOperand字段',
        );
      }

      const leftField = resolveField(metric.leftOperand);
      const rightField = resolveField(metric.rightOperand);

      const opMap: Record<string, BinaryOperator> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
      };

      return new BinaryExpr(
        opMap[metric.rowOperator] || '+',
        leftField,
        rightField,
        {
          alias: metric.name,
          businessName: metric.businessName,
        },
      );
    };

    const buildPostAggregateExpr = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): AggExpr => {
      if (!metric.sourceMetricId) {
        throw new Error('post_aggregate metric需要sourceMetricId字段');
      }

      const sourceExpr = resolveMetric(metric.sourceMetricId, visited);

      const funcMap: Record<string, AggFuncName> = {
        count: 'COUNT',
        sum: 'SUM',
        avg: 'AVG',
        max: 'MAX',
        min: 'MIN',
        distinct_count: 'COUNT',
      };

      const funcName = funcMap[metric.aggregateFunction || 'sum'] || 'SUM';
      const isDistinct =
        metric.distinct ||
        metric.aggregateFunction === MetricAggregateFunction.DISTINCT_COUNT;

      return new AggExpr(funcName, sourceExpr, isDistinct, {
        alias: metric.name,
        businessName: metric.businessName,
      });
    };

    const buildArithmeticExpr = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): BinaryExpr => {
      if (!metric.leftMetricId || !metric.arithmeticOperator) {
        throw new Error(
          'arithmetic metric需要leftMetricId和arithmeticOperator字段',
        );
      }

      const leftExpr = resolveMetric(metric.leftMetricId, visited);

      let rightExpr: Expr;

      if (
        metric.rightMetricOperand !== undefined &&
        metric.rightMetricOperand !== null
      ) {
        if (metric.rightMetricOperandFieldName) {
          rightExpr = resolveMetric(metric.rightMetricOperand, visited);
        } else {
          rightExpr = new LiteralExpr(Number(metric.rightMetricOperand));
        }
      } else {
        throw new Error('arithmetic metric需要rightMetricOperand');
      }

      const opMap: Record<string, BinaryOperator> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
      };

      return new BinaryExpr(
        opMap[metric.arithmeticOperator] || '+',
        leftExpr,
        rightExpr,
        {
          alias: metric.name,
          businessName: metric.businessName,
        },
      );
    };

    const buildDimensionExpr = (dimension: QueryDimensionDSL): Expr => {
      if (typeof dimension === 'number') {
        return resolveField(dimension);
      }

      if (dimension.derivedKind === undefined) {
        const fieldExpr = resolveField(dimension.fieldId);
        fieldExpr.meta = fieldExpr.meta || {};
        fieldExpr.meta.alias = dimension.alias || undefined;
        return fieldExpr;
      }

      if (!dimension.alias?.trim()) {
        throw new Error(
          `dimensions 中 derivedKind=${dimension.derivedKind} 的维度必须提供 alias`,
        );
      }

      let derivedExpr: Expr;
      switch (dimension.derivedKind) {
        case 'time_grain':
          derivedExpr = new CallExpr(
            'TIME_GRAIN',
            [resolveField(dimension.fieldId), new LiteralExpr(dimension.grain)],
            {
              alias: dimension.alias,
              businessName: dimension.alias,
            },
          );
          break;
        case 'bucket':
          derivedExpr = buildBucketDimensionExpr(
            resolveField(dimension.fieldId),
            dimension.ranges,
            dimension.defaultLabel,
          );
          break;
        case 'mapping':
          derivedExpr = buildMappingDimensionExpr(
            resolveField(dimension.fieldId),
            dimension.rules,
            dimension.defaultLabel,
          );
          break;
        case 'expression':
          derivedExpr = buildExpressionDimensionExpr(dimension);
          break;
        default:
          throw new Error(
            `不支持的 derivedKind: ${(dimension as { derivedKind: string }).derivedKind}`,
          );
      }

      derivedExpr.meta = {
        ...(derivedExpr.meta || {}),
        alias: dimension.alias,
        businessName: dimension.alias,
      };
      return derivedExpr;
    };

    const dimensions = (dsl.dimensions || []).map((dimension) =>
      buildDimensionExpr(dimension),
    );

    const metrics = (dsl.metrics || []).map((metricItem) => {
      const metricInfo = metricMap.get(metricItem.id);
      if (!metricInfo) {
        throw new Error(`找不到指标: ${metricItem.id}`);
      }

      const expr = resolveMetric(metricItem.id);

      if (metricItem.alias || metricInfo.businessName) {
        if (expr instanceof Expr) {
          expr.meta = expr.meta || {};
          expr.meta.alias = metricItem.alias || metricInfo.name;
          if (metricInfo.businessName) {
            expr.meta.businessName = metricInfo.businessName;
          }
        }
      }

      return expr;
    });

    const tempMetricExprs = tempMetrics.map((tempMetric) =>
      buildTempMetricExpr(tempMetric),
    );

    const resolveOrderDirection = (
      order: QueryOrderByDSL,
    ): QueryOrderDirection => {
      const dir = order.dir ?? order.direction ?? 'asc';
      if (dir !== 'asc' && dir !== 'desc') {
        throw new Error(`不支持的排序方向: ${String(dir)}`);
      }
      return dir;
    };

    const buildOrderExprFromDimension = (expr: Expr): string => {
      if (expr.meta?.alias) {
        return expr.meta.alias;
      }
      if (expr instanceof FieldRefExpr) {
        return expr.getQualifiedName();
      }
      throw new Error('派生维度排序需要 alias');
    };

    const selectedDimensions = (dsl.dimensions || []).map((dimension, index) => {
      const expr = dimensions[index];
      const fieldId =
        typeof dimension === 'number'
          ? dimension
          : 'fieldId' in dimension
            ? dimension.fieldId
            : undefined;

      return {
        fieldId,
        alias: expr.meta?.alias,
        expr,
        orderExpr: buildOrderExprFromDimension(expr),
      };
    });

    const selectedMetrics = (dsl.metrics || []).map((metricItem, index) => {
      const expr = metrics[index];
      const alias =
        expr.meta?.alias ||
        (expr instanceof FieldRefExpr ? expr.getQualifiedName() : undefined);
      if (!alias) {
        throw new Error(`指标 ${metricItem.id} 缺少可排序标识`);
      }

      return {
        metricId: metricItem.id,
        alias,
      };
    });

    const selectedTempMetrics = tempMetrics.map((tempMetric, index) => {
      const expr = tempMetricExprs[index];
      const alias = expr.meta?.alias;
      if (!alias) {
        throw new Error(`临时指标 ${tempMetric.id} 缺少可排序别名`);
      }

      return {
        tempMetricId: tempMetric.id,
        alias,
      };
    });

    const resolveOrderAlias = (
      rawAlias: string,
      order: QueryOrderByDSL,
    ): string => {
      const normalized = rawAlias.trim();
      if (!normalized) {
        throw new Error('排序 alias 不能为空');
      }

      const matchedDimension = selectedDimensions.find(
        (item) => item.alias === normalized || item.orderExpr === normalized,
      );
      if (matchedDimension) {
        return matchedDimension.orderExpr;
      }

      const matchedMetric = selectedMetrics.find(
        (item) => item.alias === normalized,
      );
      if (matchedMetric) {
        return matchedMetric.alias;
      }

      const matchedTempMetric = selectedTempMetrics.find(
        (item) => item.alias === normalized,
      );
      if (matchedTempMetric) {
        return matchedTempMetric.alias;
      }

      throw new Error(
        `排序项 ${JSON.stringify(order)} 引用了未选中的 alias: ${normalized}`,
      );
    };

    const resolveOrderExpr = (order: QueryOrderByDSL): string => {
      if (order.alias) {
        return resolveOrderAlias(order.alias, order);
      }

      if (order.field) {
        return resolveOrderAlias(order.field, order);
      }

      if (order.tempMetricId) {
        const matchedTempMetric = selectedTempMetrics.find(
          (item) => item.tempMetricId === order.tempMetricId,
        );
        if (!matchedTempMetric) {
          throw new Error(
            `排序项 ${JSON.stringify(order)} 引用了未选中的临时指标: ${order.tempMetricId}`,
          );
        }
        return matchedTempMetric.alias;
      }

      if (order.metricId !== undefined) {
        const matchedMetric = selectedMetrics.find(
          (item) => item.metricId === order.metricId,
        );
        if (!matchedMetric) {
          throw new Error(
            `排序项 ${JSON.stringify(order)} 引用了未选中的指标: ${order.metricId}`,
          );
        }
        return matchedMetric.alias;
      }

      if (order.fieldId !== undefined) {
        const matchedDimensions = selectedDimensions.filter(
          (item) => item.fieldId === order.fieldId,
        );
        if (matchedDimensions.length === 0) {
          throw new Error(
            `排序项 ${JSON.stringify(order)} 引用了未选中的维度字段: ${order.fieldId}`,
          );
        }
        if (matchedDimensions.length > 1) {
          throw new Error(
            `字段 ${order.fieldId} 在当前查询中对应多个维度，请改用 alias 排序`,
          );
        }
        return matchedDimensions[0].orderExpr;
      }

      throw new Error(
        `排序项 ${JSON.stringify(order)} 必须指定 fieldId、metricId、tempMetricId 或 alias`,
      );
    };

    const orderBy =
      dsl.orderBy?.map((order) => ({
        expr: resolveOrderExpr(order),
        dir: resolveOrderDirection(order),
      })) || undefined;

    const filters = (dsl.filters || []).map((filter) => {
      const fieldExpr = resolveField(filter.fieldId);

      if (filter.op === 'recent_days' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_DAYS,
          filter.value,
        );
      }
      if (filter.op === 'recent_weeks' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_WEEKS,
          filter.value,
        );
      }
      if (filter.op === 'recent_months' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_MONTHS,
          filter.value,
        );
      }

      switch (filter.op) {
        case 'in': {
          const values = Array.isArray(filter.value)
            ? filter.value.map((v) => new LiteralExpr(v))
            : [new LiteralExpr(filter.value)];
          return new InExpr(fieldExpr, values, false);
        }

        case 'not_in': {
          const values = Array.isArray(filter.value)
            ? filter.value.map((v) => new LiteralExpr(v))
            : [new LiteralExpr(filter.value)];
          return new InExpr(fieldExpr, values, true);
        }

        case 'between': {
          if (
            filter.value &&
            typeof filter.value === 'object' &&
            'low' in filter.value &&
            'high' in filter.value
          ) {
            const rangeValue = filter.value as { low: unknown; high: unknown };
            return new BetweenExpr(
              fieldExpr,
              new LiteralExpr(
                rangeValue.low as string | number | boolean | null,
              ),
              new LiteralExpr(
                rangeValue.high as string | number | boolean | null,
              ),
              false,
            );
          }
          throw new Error('BETWEEN 操作符需要 { low, high } 格式的 value');
        }

        case 'not_between': {
          if (
            filter.value &&
            typeof filter.value === 'object' &&
            'low' in filter.value &&
            'high' in filter.value
          ) {
            const rangeValue = filter.value as { low: unknown; high: unknown };
            return new BetweenExpr(
              fieldExpr,
              new LiteralExpr(
                rangeValue.low as string | number | boolean | null,
              ),
              new LiteralExpr(
                rangeValue.high as string | number | boolean | null,
              ),
              true,
            );
          }
          throw new Error('NOT BETWEEN 操作符需要 { low, high } 格式的 value');
        }

        case 'like':
          return new LikeExpr(fieldExpr, new LiteralExpr(filter.value), false);

        case 'not_like':
          return new LikeExpr(fieldExpr, new LiteralExpr(filter.value), true);

        case 'is_null':
          return new IsNullExpr(fieldExpr, false);

        case 'is_not_null':
          return new IsNullExpr(fieldExpr, true);

        default: {
          const opMap: Record<string, Operator> = {
            '=': Operator.EQUALS,
            '!=': Operator.NOT_EQUALS,
            '>': Operator.GREATER_THAN,
            '<': Operator.LESS_THAN,
            '>=': Operator.GREATER_EQUAL,
            '<=': Operator.LESS_EQUAL,
          };

          const op = opMap[filter.op];
          if (!op) {
            throw new Error(`不支持的操作符: ${filter.op}`);
          }

          let value: any = filter.value;
          if (filter.raw && typeof value === 'string') {
            value = { rawSql: value };
          }

          return new ComparisonExpr(
            op as ComparisonOperator,
            fieldExpr,
            value !== undefined ? new LiteralExpr(value) : (undefined as any),
          );
        }
      }
    });

    return {
      from: {
        table: mainTableInfo.tableName,
        alias: mainTableAlias,
      },
      joins,
      dimensions,
      metrics: [...metrics, ...tempMetricExprs],
      filters,
      orderBy,
      limit: dsl.limit,
      offset: dsl.offset,
    };
  }

  private static parseCaseCondition(
    caseCondition: string,
    defaultExpr: FieldRefExpr,
    _fieldMap: Map<number, DatasetFieldResponse>,
    defaultTableAlias: string,
  ): ConditionalExpr {
    const eqMatch = caseCondition.match(/^(\w+)\s*=\s*'([^']+)'$/);
    const neqMatch = caseCondition.match(/^(\w+)\s*!=\s*'([^']+)'$/);
    const gtMatch = caseCondition.match(/^(\w+)\s*>\s*(\d+)$/);
    const gteMatch = caseCondition.match(/^(\w+)\s*>=\s*(\d+)$/);
    const ltMatch = caseCondition.match(/^(\w+)\s*<\s*(\d+)$/);
    const lteMatch = caseCondition.match(/^(\w+)\s*<=\s*(\d+)$/);

    let conditionExpr: ComparisonExpr;

    if (eqMatch) {
      const [, fieldName, value] = eqMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '=',
        fieldExpr,
        new LiteralExpr(value),
      );
    } else if (neqMatch) {
      const [, fieldName, value] = neqMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '!=',
        fieldExpr,
        new LiteralExpr(value),
      );
    } else if (gtMatch) {
      const [, fieldName, value] = gtMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '>',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (gteMatch) {
      const [, fieldName, value] = gteMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '>=',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (ltMatch) {
      const [, fieldName, value] = ltMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '<',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (lteMatch) {
      const [, fieldName, value] = lteMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '<=',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else {
      conditionExpr = new ComparisonExpr(
        '=',
        new LiteralExpr(1),
        new LiteralExpr(1),
      );
    }

    return new ConditionalExpr(conditionExpr, defaultExpr, new LiteralExpr(0));
  }
}
