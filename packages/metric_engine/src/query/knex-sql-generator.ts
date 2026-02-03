import knex, { Knex as KnexType } from 'knex';
import { Query } from './query-builder';
import { Field } from '../core/field';
import { Filter, TimeFilter } from './filter';
import { Join } from '../core/join';
import { Operator } from '../core/types';
import { AggregateMetric, SubQueryMetric, RowLevelMetric, ArithmeticMetric, PostAggregateMetric } from '../metrics/metric-classes';
import { AliasRegistry } from './alias-registry';

/**
 * 基于Knex的SQL生成器
 * 使用Knex查询构建器替代字符串拼接
 */
export class KnexSQLGenerator {
  private static knexInstance: KnexType | null = null;

  /**
   * 初始化Knex实例
   */
  static initializeKnex(config?: KnexType.Config) {
    if (!this.knexInstance) {
      this.knexInstance = knex(config || {
        client: 'mysql2',
        connection: {
          host: 'localhost',
          user: 'root',
          password: '2586603nnj',
          database: 'metric_test'
        }
      });
    }
    return this.knexInstance;
  }

  /**
   * 获取Knex实例
   */
  static getKnex(): KnexType {
    if (!this.knexInstance) {
      throw new Error('Knex not initialized. Call initializeKnex() first.');
    }
    return this.knexInstance;
  }

  /**
   * 生成SELECT查询
   */
  static generateSelect(query: Query): { sql: string; bindings: any[] } {
    const knex = this.getKnex();

    // 别名应该在构建 Query 时已经分配好，这里直接使用
    if (!query.mainTable.alias) {
      throw new Error('Query 的主表必须已分配别名，请先调用 QueryBuilder.assignTableAliases()');
    }

    let queryBuilder = knex(query.mainTable.name);
    // 如果主表有别名
    if (query.mainTable.alias) {
      queryBuilder = knex(`${query.mainTable.name} as ${query.mainTable.alias}`);
    }

    // 添加JOIN
    queryBuilder = this.applyJoins(queryBuilder, query);

    // 添加WHERE条件
    queryBuilder = this.applyFilters(queryBuilder, query);

    // 构建SELECT子句
    const selectItems = this.buildSelectItems(query);
    queryBuilder = queryBuilder.select(selectItems);

    // 添加GROUP BY
    if (query.dimensions.length > 0) {
      const groupByFields: string[] = [];
      const hasJoins = query.joins.length > 0;

      query.dimensions.forEach(dim => {
        let fieldExpr = dim.field.name;
        if (hasJoins) {
          // 如果有JOIN，需要确定字段属于哪个表
          const mainTableAlias = query.mainTable.alias;
          const fieldInMainTable = query.mainTable.getField(dim.field.name);

          if (fieldInMainTable) {
            fieldExpr = mainTableAlias ? `${mainTableAlias}.${dim.field.name}` : dim.field.name;
          } else {
            // 在JOIN表中查找
            for (const join of query.joins) {
              const joinTableAlias = join.rightTable.alias;
              const fieldInJoinTable = join.rightTable.getField(dim.field.name);
              if (fieldInJoinTable) {
                fieldExpr = joinTableAlias ? `${joinTableAlias}.${dim.field.name}` : dim.field.name;
                break;
              }
            }
          }
        }
        groupByFields.push(fieldExpr);
      });

      queryBuilder = queryBuilder.groupBy(groupByFields);
    }

    // 获取SQL和绑定参数
    // 如果需要预聚合（内层子查询），使用 Knex 构建 inner 子查询并在 FROM 使用 (inner) AS inner_metrics（兼容多数方言）
    const needsPreAggregation = query.metrics.some(metric =>
      (metric instanceof RowLevelMetric) || (metric instanceof ArithmeticMetric)
    );

    if (needsPreAggregation && query.dimensions.length > 0) {
      const knexInstance = this.getKnex();

      // 构建 inner 查询（只包含维度和可在 inner 层聚合的指标：AggregateMetric / RowLevelMetric）
      const innerSelectItems: any[] = [];
      let colIdx = 1;
      const hasJoins = query.joins.length > 0;

      // dims
      query.dimensions.forEach(dim => {
        const fieldExpr = (() => {
          if (!hasJoins) return dim.field.name;
          const mainTableAlias = query.mainTable.alias;
          const fieldInMain = query.mainTable.getField(dim.field.name);
          if (fieldInMain) return mainTableAlias ? `${mainTableAlias}.${dim.field.name}` : dim.field.name;
          for (const join of query.joins) {
            const ja = join.rightTable.alias;
            if (join.rightTable.getField(dim.field.name)) return ja ? `${ja}.${dim.field.name}` : dim.field.name;
          }
          return dim.field.name;
        })();

        innerSelectItems.push(this.getKnex().raw(`?? AS ??`, [fieldExpr, `column_${colIdx}`]));
        colIdx++;
      });

      // base metrics for inner
      const baseMetrics = query.metrics.filter(m => (m instanceof AggregateMetric) || (m instanceof RowLevelMetric));
      baseMetrics.forEach(metric => {
        const englishAlias = `column_${colIdx}`;
        let metricSql = metric.toSQL();
        if (hasJoins) {
          metricSql = this.resolveFieldReferencesInMetric(metricSql, query);
        }
        if (metric instanceof RowLevelMetric) {
          metricSql = `SUM(${metricSql})`;
        }
        innerSelectItems.push(this.getKnex().raw(`${metricSql} AS ??`, [englishAlias]));
        colIdx++;
      });

      // build inner query
      let innerBuilder = knexInstance(query.mainTable.name);
      if (query.mainTable.alias) innerBuilder = knexInstance(`${query.mainTable.name} as ${query.mainTable.alias}`);
      innerBuilder = this.applyJoins(innerBuilder, query);
      innerBuilder = this.applyFilters(innerBuilder, query);
      innerBuilder = innerBuilder.select(innerSelectItems);

      // group by dims
      if (query.dimensions.length > 0) {
        const groupByFields: string[] = [];
        query.dimensions.forEach(dim => {
          let fieldExpr = dim.field.name;
          if (hasJoins) {
            const mainTableAlias = query.mainTable.alias;
            const fieldInMainTable = query.mainTable.getField(dim.field.name);
            if (fieldInMainTable) {
              fieldExpr = mainTableAlias ? `${mainTableAlias}.${dim.field.name}` : dim.field.name;
            } else {
              for (const join of query.joins) {
                const joinTableAlias = join.rightTable.alias;
                const fieldInJoinTable = join.rightTable.getField(dim.field.name);
                if (fieldInJoinTable) {
                  fieldExpr = joinTableAlias ? `${joinTableAlias}.${dim.field.name}` : dim.field.name;
                  break;
                }
              }
            }
          }
          groupByFields.push(fieldExpr);
        });
        innerBuilder = innerBuilder.groupBy(groupByFields);
      }

      // outer select: dims from inner, base metrics mapped, others computed
      const outerSelectItems: any[] = [];
      let outerIdx = 1;
      // dims
      query.dimensions.forEach(() => {
        outerSelectItems.push(this.getKnex().raw(`inner_metrics.?? AS ??`, [`column_${outerIdx}`, `column_${outerIdx}`]));
        outerIdx++;
      });

      // map base metric to inner column index
      const baseMetricStart = query.dimensions.length + 1;
      const baseMetricColumnFor = new Map<any, number>();
      baseMetrics.forEach((m, i) => baseMetricColumnFor.set(m, baseMetricStart + i));

      // final metrics
      query.metrics.forEach(metric => {
        const englishAlias = `column_${outerIdx}`;
        if (baseMetricColumnFor.has(metric)) {
          const idx = baseMetricColumnFor.get(metric);
          outerSelectItems.push(this.getKnex().raw(`inner_metrics.?? AS ??`, [`column_${idx}`, englishAlias]));
        } else if (metric instanceof ArithmeticMetric) {
          const leftOp = (metric as any).leftMetric;
          const rightOp = (metric as any).rightOperand;
          const operator = (metric as any).operator || '/';
          const resolveOperandToInner = (op: any): string => {
            if (op === null || op === undefined) return 'NULL';
            if (typeof op === 'number') return String(op);
            for (const [bm, idx] of baseMetricColumnFor.entries()) {
              if (bm === op || (bm.name && op.name && bm.name === op.name)) return `inner_metrics.column_${idx}`;
            }
            if (typeof op.toSQL === 'function') return op.toSQL();
            if (op.getFullName) return op.getFullName();
            return String(op);
          };
          const leftSql = resolveOperandToInner(leftOp);
          const rightSql = resolveOperandToInner(rightOp);
          outerSelectItems.push(this.getKnex().raw(`(${leftSql} ${operator} ${rightSql}) AS ??`, [englishAlias]));
        } else if (metric instanceof SubQueryMetric) {
          const queryContext: any = { tableAliases: {}, mainTable: query.mainTable, joins: query.joins };
          queryContext.tableAliases[query.mainTable.name] = query.mainTable.alias || query.mainTable.name;
          query.joins.forEach(join => { queryContext.tableAliases[join.rightTable.name] = join.rightTable.alias || join.rightTable.name; });
          const subSql = `(${(metric as any).generateSubQuerySQL(queryContext)})`;
          outerSelectItems.push(this.getKnex().raw(`${subSql} AS ??`, [englishAlias]));
        } else if (metric instanceof PostAggregateMetric) {
          // PostAggregateMetric 应该引用 inner 层的列
          const refMetric = (metric as any).metric;
          const refIndex = baseMetrics.findIndex(bm => bm.name === refMetric.name);
          if (refIndex >= 0) {
            // baseMetricStart 是 inner 层第一个指标列的位置
            // refIndex 是被引用指标在 baseMetrics 数组中的索引
            // 所以 column_X = baseMetricStart + refIndex
            const refColumnIdx = baseMetricStart + refIndex;
            const funcName = metric.function.toUpperCase();
            outerSelectItems.push(this.getKnex().raw(`${funcName}(inner_metrics.??) AS ??`, [`column_${refColumnIdx}`, englishAlias]));
          } else {
            // fallback: 如果找不到被引用的指标，使用 metric.toSQL()
            outerSelectItems.push(this.getKnex().raw(`${metric.toSQL()} AS ??`, [englishAlias]));
          }
        } else {
          // fallback: use metric.toSQL()
          let metricSql = metric.toSQL();
          if (hasJoins && metric.constructor.name !== 'SubQueryMetric') {
            // reuse simple replacement
            metricSql = this.resolveFieldReferencesInMetric(metricSql, query);
          }
          outerSelectItems.push(this.getKnex().raw(`${metricSql} AS ??`, [englishAlias]));
        }
        outerIdx++;
      });

      // 检查是否有 PostAggregateMetric，需要在外层添加 GROUP BY
      const hasPostAggregateMetric = query.metrics.some(m => m instanceof PostAggregateMetric);
      let outerBuilder = knexInstance.select(outerSelectItems).from(innerBuilder.as('inner_metrics'));
      if (hasPostAggregateMetric && query.dimensions.length > 0) {
        // PostAggregateMetric 需要按维度列分组
        const groupByColumns = query.dimensions.map((_, idx) => `inner_metrics.column_${idx + 1}`);
        outerBuilder = outerBuilder.groupBy(groupByColumns);
      }

      const result = outerBuilder.toSQL();
      return {
        sql: result.sql,
        bindings: [...result.bindings]
      };
    }

    const result = queryBuilder.toSQL();
    return {
      sql: result.sql,
      bindings: [...result.bindings] // 转换为可变数组
    };
  }

  /**
   * 应用JOIN操作
   */
  private static applyJoins(queryBuilder: KnexType.QueryBuilder, query: Query): KnexType.QueryBuilder {
    for (const join of query.joins) {
      const joinType = this.getJoinType(join.type);
      const rightTable = join.rightTable.alias ? `${join.rightTable.name} as ${join.rightTable.alias}` : join.rightTable.name;

      // 构建JOIN条件
      const knexInstance = this.getKnex();
      queryBuilder = (queryBuilder as any)[joinType](rightTable, function(this: any) {
        for (const condition of join.conditions) {
          const leftTableAlias = join.leftTable.alias;
          const rightTableAlias = join.rightTable.alias;
          const leftField = leftTableAlias ? `${leftTableAlias}.${condition.leftField}` : condition.leftField;
          const rightField = rightTableAlias ? `${rightTableAlias}.${condition.rightField}` : condition.rightField;
          this.on(knexInstance.raw(`${leftField} = ${rightField}`));
        }
      });
    }

    return queryBuilder;
  }

  /**
   * 应用WHERE过滤条件
   */
  private static applyFilters(queryBuilder: KnexType.QueryBuilder, query: Query): KnexType.QueryBuilder {
    for (const filter of query.filters) {
      queryBuilder = this.applyFilter(queryBuilder, filter, query);
    }

    return queryBuilder;
  }

  /**
   * 应用单个过滤条件
   */
  private static applyFilter(queryBuilder: KnexType.QueryBuilder, filter: Filter, query: Query): KnexType.QueryBuilder {
    // 特殊处理TimeFilter
    if (filter instanceof TimeFilter) {
      return queryBuilder.where(this.getKnex().raw(filter.toSQL()));
    }
    // determine qualified field name using query context
    const fieldObj: any = filter.field;
    let fieldName: string = '';
    if (fieldObj && fieldObj.name) {
      // check main table
      if (query.mainTable.getField(fieldObj.name)) {
        fieldName = (query.mainTable.alias ? `${query.mainTable.alias}` : query.mainTable.name) + `.${fieldObj.name}`;
      } else {
        // check joins
        let found = false;
        for (const join of query.joins) {
          if (join.rightTable.getField(fieldObj.name)) {
            fieldName = (join.rightTable.alias ? `${join.rightTable.alias}` : join.rightTable.name) + `.${fieldObj.name}`;
            found = true;
            break;
          }
        }
        if (!found) {
          // fallback to raw getFullName
          fieldName = fieldObj.getFullName ? fieldObj.getFullName() : fieldObj.name;
        }
      }
    } else {
      fieldName = filter.field.getFullName ? filter.field.getFullName() : String(filter.field);
    }

    switch (filter.operator) {
      case Operator.EQUALS:
      case '=':
        return queryBuilder.where(fieldName, filter.value);

      case Operator.NOT_EQUALS:
      case '!=':
        return queryBuilder.whereNot(fieldName, filter.value);

      case Operator.GREATER_THAN:
      case '>':
        return queryBuilder.where(fieldName, '>', filter.value);

      case Operator.LESS_THAN:
      case '<':
        return queryBuilder.where(fieldName, '<', filter.value);

      case Operator.GREATER_EQUAL:
      case '>=':
        return queryBuilder.where(fieldName, '>=', filter.value);

      case Operator.LESS_EQUAL:
      case '<=':
        return queryBuilder.where(fieldName, '<=', filter.value);

      case Operator.LIKE:
        return queryBuilder.where(fieldName, 'like', filter.value);

      case Operator.IN:
        return queryBuilder.whereIn(fieldName, Array.isArray(filter.value) ? filter.value : [filter.value]);

      case Operator.NOT_IN:
        return queryBuilder.whereNotIn(fieldName, Array.isArray(filter.value) ? filter.value : [filter.value]);

      case Operator.IS_NULL:
        return queryBuilder.whereNull(fieldName);

      case Operator.IS_NOT_NULL:
        return queryBuilder.whereNotNull(fieldName);

      default:
        // 对于不支持的操作符，使用raw SQL
        return queryBuilder.where(this.getKnex().raw(`${fieldName} ${filter.operator} ?`, [filter.value]));
    }
  }

  /**
   * 构建SELECT子句项
   */
  private static buildSelectItems(query: Query): any[] {
    const selectItems: any[] = [];
    let columnIndex = 1;

    const hasJoins = query.joins.length > 0;

    // 添加维度（带别名和注释）
    query.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = dim.alias || dim.field.name;

      // 确定字段表达式
      let fieldExpr = dim.field.name;
      if (hasJoins) {
        // 如果有JOIN，需要确定字段属于哪个表
        const mainTableAlias = query.mainTable.alias;
        const fieldInMainTable = query.mainTable.getField(dim.field.name);

        if (fieldInMainTable) {
          fieldExpr = mainTableAlias ? `${mainTableAlias}.${dim.field.name}` : dim.field.name;
        } else {
          // 在JOIN表中查找
          for (const join of query.joins) {
            const joinTableAlias = join.rightTable.alias;
            const fieldInJoinTable = join.rightTable.getField(dim.field.name);
            if (fieldInJoinTable) {
              fieldExpr = joinTableAlias ? `${joinTableAlias}.${dim.field.name}` : dim.field.name;
              break;
            }
          }
        }
      }

      // 使用Knex的raw方法添加别名，使用??占位符确保标识符转义
      selectItems.push(
        this.getKnex().raw(`?? AS ??`, [fieldExpr, englishAlias])
      );
      columnIndex++;
    });

    // 添加指标
    query.metrics.forEach(metric => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = metric.alias || metric.name;

      // 获取指标的SQL表达式，但需要处理字段引用歧义问题
      let metricSql = metric.toSQL();

      // 如果是 SubQueryMetric，需要用查询上下文生成子查询并替换占位符
      if (hasJoins && metric instanceof SubQueryMetric) {
        const queryContext: any = {
          tableAliases: {},
          mainTable: query.mainTable,
          joins: query.joins
        };
        queryContext.tableAliases[query.mainTable.name] = query.mainTable.alias || query.mainTable.name;
        query.joins.forEach(join => {
          queryContext.tableAliases[join.rightTable.name] = join.rightTable.alias || join.rightTable.name;
        });
        // generateSubQuerySQL will replace placeholders like {id} with proper alias.column
        metricSql = `(${(metric as any).generateSubQuerySQL(queryContext)})`;
      } else if (hasJoins && metric instanceof AggregateMetric) {
        // 如果有JOIN，需要替换字段引用为带表别名的形式（聚合指标）
        metricSql = this.resolveFieldReferencesInMetric(metricSql, query);
      }

      // 如果存在维度（GROUP BY），需要对行级或算术指标进行聚合包装，避免 ONLY_FULL_GROUP_BY 报错
      if (query.dimensions.length > 0) {
        metricSql = this.wrapMetricForGroup(metric, metricSql, query);
      }

      // 对于指标，使用更安全的方式处理别名
      selectItems.push(
        this.getKnex().raw(`${metricSql} AS ??`, [englishAlias])
      );
      columnIndex++;
    });

    return selectItems;
  }

  /**
   * 根据是否有 GROUP BY，将行级/算术指标包装为聚合表达式
   */
  private static wrapMetricForGroup(metric: any, metricSql: string, query: Query): string {
    // 保持已有的聚合/子查询/后聚合指标不变
    if (
      metric instanceof AggregateMetric ||
      metric instanceof SubQueryMetric ||
      metric instanceof PostAggregateMetric ||
      metric.constructor.name === 'PeriodOverPeriodMetric'
    ) {
      return metricSql;
    }

    // RowLevelMetric -> SUM(expression)
    if (metric instanceof RowLevelMetric) {
      return `SUM(${metricSql})`;
    }

    // ArithmeticMetric -> aggregate each operand then apply operator
    if (metric instanceof ArithmeticMetric) {
      const left = (metric as any).leftMetric;
      const right = (metric as any).rightOperand;
      const operator = (metric as any).operator || (metric as any).op || '/';

      const aggOperand = (op: any): string => {
        if (op === null || op === undefined) return 'NULL';
        if (typeof op === 'number') return String(op);
        if (op instanceof AggregateMetric || op instanceof SubQueryMetric || op.constructor.name === 'PostAggregateMetric') {
          return op.toSQL();
        }
        if (op instanceof ArithmeticMetric) {
          // nested arithmetic: aggregate inner expression
          return `SUM(${op.toSQL()})`;
        }
        // Field-like or RowLevelMetric or other metric-like -> SUM(...)
        if (typeof op.toSQL === 'function') {
          return `SUM(${op.toSQL()})`;
        }
        if (op.getFullName) {
          return `SUM(${op.getFullName()})`;
        }
        return `SUM(${String(op)})`;
      };

      const leftSql = aggOperand(left);
      const rightSql = aggOperand(right);
      return `(${leftSql} ${operator} ${rightSql})`;
    }

    // 兜底：其他非聚合指标使用 SUM(...) 包裹
    return `SUM(${metricSql})`;
  }

  /**
   * 解析指标中的字段引用，确保在JOIN查询中字段引用不歧义
   */
  private static resolveFieldReferencesInMetric(metricSql: string, query: Query): string {
    // 处理各种字段歧义问题，包括简单的字段引用和CASE WHEN条件

    // 常见的字段名列表
    const commonFields = ['id', 'status', 'name', 'user_id', 'module_id', 'duration_seconds', 'access_time',
                         'project_id', 'task_id', 'employee_id', 'hours', 'entry_date', 'budget', 'hourly_rate'];

    for (const fieldName of commonFields) {
      // 使用正则表达式查找不带表别名的字段引用，但避免匹配表别名本身
      // 这个正则表达式匹配单词边界，但不匹配已经在表别名中的字段
      const regex = new RegExp(`(?<!\\w\\.)\\b${fieldName}\\b`, 'g');

      // 查找这个字段在哪个表中
      let tableAlias = '';
      const mainTableAlias = query.mainTable.alias;
      const fieldInMainTable = query.mainTable.getField(fieldName);

      if (fieldInMainTable) {
        tableAlias = mainTableAlias || query.mainTable.name;
      } else {
        // 在JOIN表中查找
        for (const join of query.joins) {
          const joinTableAlias = join.rightTable.alias;
          const fieldInJoinTable = join.rightTable.getField(fieldName);
          if (fieldInJoinTable) {
            tableAlias = joinTableAlias || join.rightTable.name;
            break;
          }
        }
      }

      if (tableAlias) {
        // 替换字段引用为带表别名的形式
        metricSql = metricSql.replace(regex, `${tableAlias}.${fieldName}`);
      }
    }

    // 特殊处理子查询中的字段引用
    // 对于像 "WHERE pt.project_id = projects.id" 这样的子查询，需要确保表引用正确
    metricSql = metricSql.replace(/\bprojects\.id\b/g, `${query.mainTable.alias || query.mainTable.name}.id`);
    metricSql = metricSql.replace(/\btasks\.id\b/g, 't.id');
    metricSql = metricSql.replace(/\bproject_tasks\.project_id\b/g, 'pt.project_id');
    metricSql = metricSql.replace(/\bproject_tasks\.task_id\b/g, 'pt.task_id');

    return metricSql;
  }

  /**
   * 获取JOIN类型
   */
  private static getJoinType(joinType: string): string {
    switch (joinType.toLowerCase()) {
      case 'left':
      case 'left_join':
        return 'leftJoin';
      case 'right':
      case 'right_join':
        return 'rightJoin';
      case 'inner':
      case 'inner_join':
        return 'join';
      case 'full':
      case 'full_join':
        return 'fullOuterJoin';
      default:
        return 'leftJoin';
    }
  }

  /**
   * 生成查询并返回SQL字符串（用于调试）
   */
  static generateSQLString(query: Query): string {
    const result = this.generateSelect(query);
    return result.sql;
  }

  /**
   * 生成查询并返回带绑定参数的对象（用于执行）
   */
  static generateSQLWithBindings(query: Query): { sql: string; bindings: any[] } {
    return this.generateSelect(query);
  }
}