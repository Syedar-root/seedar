import { Query } from './query-builder';
import { Field } from '../core/field';
import { Filter, TimeFilter } from './filter';
import { Operator } from '../core/types';
import { AliasRegistry } from './alias-registry';
import { AggregateMetric, PostAggregateMetric, SubQueryMetric, RowLevelMetric, ArithmeticMetric } from '../metrics/metric-classes';

/**
 * SQL生成器类
 * 将Query对象转换为SQL语句
 */
export class SQLGenerator {
  // current alias registry for the SQL being generated; used by helpers to resolve aliases
  private static currentAliasRegistry: AliasRegistry | null = null;

  private static resolveTableAlias(table: any): string {
    const reg = this.currentAliasRegistry;
    if (reg) {
      const a = reg.getTableAlias(table.name);
      if (a) return a;
    }
    return table.alias || table.name;
  }

  /**
   * 生成SELECT语句
   */
  static generateSelect(query: Query): string {
    // create per-SQL alias registry to ensure uniqueness within this SQL statement
    const aliasRegistry = new AliasRegistry();
    // register aliases for main table and joins (do NOT mutate models)
    if (query.mainTable) {
      const mainAlias = (query.mainTable as any).alias;
      aliasRegistry.ensureTableAlias(query.mainTable.name, mainAlias, query.mainTable.name);
    }
    query.joins.forEach(join => {
      const ra = (join.rightTable as any).alias;
      aliasRegistry.ensureTableAlias(join.rightTable.name, ra, join.rightTable.name);
    });
    // set current registry for helper resolution
    this.currentAliasRegistry = aliasRegistry;

    const selectClause = this.generateSelectClause(query);
    const fromClause = this.generateFromClause(query);
    const joinClause = this.generateJoinClause(query);
    const whereClause = this.generateWhereClause(query);
    const groupByClause = this.generateGroupByClause(query);

    let sql = `SELECT ${selectClause}`;
    sql += `\nFROM ${fromClause}`;

    if (joinClause) {
      sql += `\n${joinClause}`;
    }

    if (whereClause) {
      sql += `\nWHERE ${whereClause}`;
    }

    if (groupByClause) {
      sql += `\nGROUP BY ${groupByClause}`;
    }

    return sql;
  }

  /**
   * 生成SELECT子句
   */
  private static generateSelectClause(query: Query): string {
    const selectItems: string[] = [];
    let columnIndex = 1;

    // 检查是否有JOIN，如果有JOIN，需要使用表别名来避免字段歧义
    const hasJoins = query.joins.length > 0;

    // 添加维度
    query.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = dim.alias || dim.field.name;

      // 如果有JOIN，需要找到这个字段属于哪个表，并使用表别名
      let fieldExpr = dim.field.getFullName(); // 默认值
      if (hasJoins) {
        // 尝试从主表或JOIN表中找到这个字段
        const mainTableAlias = this.resolveTableAlias(query.mainTable);
        const fieldInMainTable = query.mainTable.getField(dim.field.name);

        if (fieldInMainTable) {
          // 字段在主表中
          fieldExpr = dim.field.getFullName(mainTableAlias);
        } else {
          // 尝试在JOIN表中查找
          let foundInJoin = false;
          for (const join of query.joins) {
            const joinTableAlias = this.resolveTableAlias(join.rightTable);
            const fieldInJoinTable = join.rightTable.getField(dim.field.name);
            if (fieldInJoinTable) {
              fieldExpr = dim.field.getFullName(joinTableAlias);
              foundInJoin = true;
              break;
            }
          }
          // 如果都没找到，使用不带表别名的字段名（可能会有歧义，但至少能运行）
          fieldExpr = dim.field.getFullName();
        }
      } else {
        // 没有JOIN，使用普通的字段名
        fieldExpr = dim.field.getFullName();
      }

      selectItems.push(`${fieldExpr} AS ${englishAlias} /* ${chineseName} */`);
      columnIndex++;
    });

    // 添加指标（PeriodOverPeriodMetric现在通过CTE方式处理，不在此处生成）
    query.metrics.forEach(metric => {
      if (metric.constructor.name !== 'PeriodOverPeriodMetric') {
        let metricSQL: string;

        // 特殊处理SubQueryMetric
        if (metric.constructor.name === 'SubQueryMetric') {
          const subQueryMetric = metric as any;
          const queryContext = this.buildQueryContext(query);
          metricSQL = `(${subQueryMetric.generateSubQuerySQL(queryContext)})`;
        } else {
          // 普通指标生成SQL
          metricSQL = metric.toSQL();
        }

        // 如果有JOIN，需要确保指标中的字段引用包含表别名
        // 但是SubQueryMetric的SQL已经通过generateSubQuerySQL方法正确处理了别名，无需再次修复
        if (hasJoins && metric.constructor.name !== 'SubQueryMetric') {
          metricSQL = this.fixMetricFieldReferences(metricSQL, query);
        }

        // 如果存在维度（GROUP BY），对行级或算术指标进行聚合包装，避免 ONLY_FULL_GROUP_BY 报错
        if (query.dimensions.length > 0) {
          metricSQL = this.wrapMetricForGroup(metric, metricSQL, query);
        }

        const englishAlias = `column_${columnIndex}`;
        const chineseName = metric.getDisplayName();
        selectItems.push(`${metricSQL} AS ${englishAlias} /* ${chineseName} */`);
        columnIndex++;
      }
    });

    return selectItems.join(', ');
  }

  /**
   * 构建查询上下文（用于SubQueryMetric）
   */
  private static buildQueryContext(query: Query): any {
    const context: any = {
      tableAliases: {},
      mainTable: query.mainTable,
      joins: query.joins
    };

    // 主表别名
    context.tableAliases[query.mainTable.name] = this.resolveTableAlias(query.mainTable);

    // JOIN表别名
    query.joins.forEach(join => {
      context.tableAliases[join.rightTable.name] = this.resolveTableAlias(join.rightTable);
    });

    return context;
  }

  /**
   * 生成FROM子句
   */
  private static generateFromClause(query: Query): string {
    const alias = this.resolveTableAlias(query.mainTable);
    if (alias && alias !== query.mainTable.name) {
      return `${query.mainTable.name} AS ${alias}`;
    }
    return query.mainTable.name;
  }

  /**
   * 生成JOIN子句
   */
  private static generateJoinClause(query: Query): string {
    if (query.joins.length === 0) {
      return '';
    }

    return query.joins
      .map(join => join.toSQL())
      .join('\n');
  }

  /**
   * 生成WHERE子句
   */
  private static generateWhereClause(query: Query): string {
    if (query.filters.length === 0) {
      return '';
    }

    const filterSQLs: string[] = [];
    for (const filter of query.filters) {
      // If filter.field is a Field, resolve its table alias and build a temporary Field
      // whose getFullName() returns qualified alias.column, then use Filter.toSQL on it.
      try {
        const fField: any = (filter as any).field;
        if (fField && typeof fField.getFullName === 'function' && fField.name) {
          // find which table contains this field
          let tableAlias: string | null = null;
          if (query.mainTable.getField(fField.name)) {
            tableAlias = query.mainTable.alias || query.mainTable.name;
          } else {
            for (const join of query.joins) {
              if (join.rightTable.getField(fField.name)) {
                tableAlias = join.rightTable.alias || join.rightTable.name;
                break;
              }
            }
          }

          if (tableAlias) {
            // create a temporary Field with alias set to qualified name so toSQL emits qualified field
            const tempField = new Field({ name: fField.name, type: fField.type, alias: `${tableAlias}.${fField.name}`, description: fField.description });
            // Preserve TimeFilter semantics
            if (filter instanceof TimeFilter) {
              // TimeFilter has private constructor; temporarily replace its field for correct SQL generation
              const oldField = (filter as any).field;
              (filter as any).field = tempField;
              try {
                filterSQLs.push((filter as any).toSQL());
              } finally {
                (filter as any).field = oldField;
              }
            } else {
              const tempFilter = new Filter(tempField, filter.operator, filter.value);
              filterSQLs.push(tempFilter.toSQL());
            }
            continue;
          }
        }
      } catch (e) {
        // fallback to original toSQL on error
      }

      // fallback
      filterSQLs.push((filter as any).toSQL());
    }

    return filterSQLs.join(' AND ');
  }

  /**
   * 生成GROUP BY子句
   */
  private static generateGroupByClause(query: Query): string {
    // 如果有聚合指标，则需要GROUP BY所有需要的字段
    const hasAggregateMetrics = query.metrics.some(metric =>
      metric.constructor.name === 'AggregateMetric' ||
      metric.constructor.name === 'PostAggregateMetric'
    );

    if (!hasAggregateMetrics) {
      return '';
    }

    const groupByFields = new Set<string>();
    const hasJoins = query.joins.length > 0;

    // 1. 添加所有维度字段
    query.dimensions.forEach(dim => {
      if (hasJoins) {
        // 如果有JOIN，需要找到这个字段属于哪个表，并使用表别名
        const mainTableAlias = query.mainTable.alias || query.mainTable.name;
        const fieldInMainTable = query.mainTable.getField(dim.field.name);

        if (fieldInMainTable) {
          // 字段在主表中
          groupByFields.add(dim.field.getFullName(mainTableAlias));
        } else {
          // 尝试在JOIN表中查找
          for (const join of query.joins) {
            const joinTableAlias = join.rightTable.alias || join.rightTable.name;
            const fieldInJoinTable = join.rightTable.getField(dim.field.name);
            if (fieldInJoinTable) {
              groupByFields.add(dim.field.getFullName(joinTableAlias));
              break;
            }
          }
        }
      } else {
        // 没有JOIN，使用普通的字段名
        groupByFields.add(dim.field.getFullName());
      }
    });

    // 2. 分析聚合指标中的字段引用（特别是自定义SQL模板）
    query.metrics.forEach(metric => {
      if (metric.constructor.name !== 'PeriodOverPeriodMetric') {
        const metricSQL = metric.toSQL();

        // 分析SQL中可能包含的字段引用
        // 这里需要解析SQL模板中的字段，特别是自定义模板
        if (metric.constructor.name === 'AggregateMetric') {
          const aggMetric = metric as any;
          if (aggMetric.condition?.sqlTemplate) {
            // 解析自定义SQL模板中的字段引用
            const template = aggMetric.condition.sqlTemplate;
            const fieldRefs = this.extractFieldReferencesFromTemplate(template, query);
            fieldRefs.forEach(fieldRef => groupByFields.add(fieldRef));
          }
        }
      }
    });

    return Array.from(groupByFields).join(', ');
  }

  /**
   * 从SQL模板中提取字段引用
   */
  private static extractFieldReferencesFromTemplate(template: string, query: Query): string[] {
    const fieldRefs: string[] = [];
    const hasJoins = query.joins.length > 0;

    // 简单的方法：查找所有表别名.字段名的模式
    const aliasPattern = /\b(\w+)\.(\w+)\b/g;
    let match;

    while ((match = aliasPattern.exec(template)) !== null) {
      const alias = match[1];
      const fieldName = match[2];

      // 验证这个别名和字段名是否有效
      let tableFound = false;

      // 检查主表
      if (this.resolveTableAlias(query.mainTable) === alias) {
        if (query.mainTable.getField(fieldName)) {
          fieldRefs.push(`${alias}.${fieldName}`);
          tableFound = true;
        }
      }

      // 检查JOIN表
      if (!tableFound) {
        for (const join of query.joins) {
          if (this.resolveTableAlias(join.rightTable) === alias) {
            if (join.rightTable.getField(fieldName)) {
              fieldRefs.push(`${alias}.${fieldName}`);
              tableFound = true;
              break;
            }
          }
        }
      }
    }

    return fieldRefs;
  }

  /**
   * 当查询包含 GROUP BY 时，将非聚合的行级/算术指标包装为聚合表达式
   */
  private static wrapMetricForGroup(metric: any, metricSQL: string, query: Query): string {
    if (
      metric.constructor.name === 'AggregateMetric' ||
      metric.constructor.name === 'PostAggregateMetric' ||
      metric.constructor.name === 'SubQueryMetric' ||
      metric.constructor.name === 'PeriodOverPeriodMetric'
    ) {
      return metricSQL;
    }

    if (metric instanceof RowLevelMetric) {
      return `SUM(${metricSQL})`;
    }

    if (metric instanceof ArithmeticMetric) {
      const left = (metric as any).leftMetric;
      const right = (metric as any).rightOperand;
      const operator = (metric as any).operator || '/';

      const aggOperand = (op: any): string => {
        if (op === null || op === undefined) return 'NULL';
        if (typeof op === 'number') return String(op);
        if (op.constructor && (op.constructor.name === 'AggregateMetric' || op.constructor.name === 'SubQueryMetric' || op.constructor.name === 'PostAggregateMetric')) {
          return op.toSQL();
        }
        if (op instanceof ArithmeticMetric) {
          return `SUM(${op.toSQL()})`;
        }
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
    return `SUM(${metricSQL})`;
  }

  /**
   * 生成完整的SQL语句（包含错误处理）
   */
  static generate(query: Query): { sql: string; errors: string[]; aliasMapping?: any } {
    const errors: string[] = [];

    try {
      // 验证查询的完整性
      if (query.dimensions.length === 0 && query.metrics.length === 0) {
        errors.push('查询必须至少包含一个维度或指标');
      }

      // 检查是否有重复的字段别名
      const aliases = new Set<string>();
      const checkAlias = (alias: string | undefined, type: string) => {
        if (alias && aliases.has(alias)) {
          errors.push(`重复的别名: ${alias}`);
        } else if (alias) {
          aliases.add(alias);
        }
      };

      query.dimensions.forEach(dim => checkAlias(dim.alias, '维度'));
      query.metrics.forEach(metric => checkAlias(metric.alias, '指标'));

      if (errors.length > 0) {
        return { sql: '', errors };
      }

      // 检查是否包含PeriodOverPeriodMetric
      const hasPeriodOverPeriodMetrics = query.metrics.some(metric =>
        metric.constructor.name === 'PeriodOverPeriodMetric'
      );

      // 是否需要预聚合（存在行级或算术指标）
      const needsPreAggregation = query.metrics.some(metric =>
        (metric instanceof RowLevelMetric) || (metric instanceof ArithmeticMetric)
      );

      let sql: string;
      if (hasPeriodOverPeriodMetrics) {
        // 使用CTE方式生成同环比查询
        sql = this.generateWithPeriodOverPeriodCTE(query);
      } else if (needsPreAggregation && query.dimensions.length > 0) {
        // 当存在维度且需要预聚合的指标时，使用分阶段CTE方案
        sql = this.generateWithPreAggregationCTE(query);
      } else {
        // 普通查询
        sql = this.generateSelect(query);
      }

      // build alias mapping for caller (logical table/field -> actual alias.column)
      const aliasMapping: any = { tables: {}, columns: {} };
      if (query.mainTable) {
        const tableAlias = query.mainTable.alias || query.mainTable.name;
        aliasMapping.tables[query.mainTable.name] = tableAlias;
        query.mainTable.fields.forEach((f: Field) => {
          aliasMapping.columns[`${query.mainTable.name}.${f.name}`] = `${tableAlias}.${f.name}`;
        });
      }
      query.joins.forEach(join => {
        const rt = join.rightTable;
        const tableAlias = rt.alias || rt.name;
        aliasMapping.tables[rt.name] = tableAlias;
        rt.fields.forEach((f: Field) => {
          aliasMapping.columns[`${rt.name}.${f.name}`] = `${tableAlias}.${f.name}`;
        });
      });

      return { sql, errors: [], aliasMapping };
    } catch (error) {
      errors.push(`SQL生成错误: ${error instanceof Error ? error.message : '未知错误'}`);
      return { sql: '', errors };
    }
  }

  /**
   * 生成包含PeriodOverPeriodMetric的查询（最终优化版本）
   */
  private static generateWithPeriodOverPeriodCTE(query: Query): string {
    // 提取PeriodOverPeriodMetric
    const popMetrics = query.metrics.filter(metric =>
      metric.constructor.name === 'PeriodOverPeriodMetric'
    ) as any[];

    // 提取普通指标
    const regularMetrics = query.metrics.filter(metric =>
      metric.constructor.name !== 'PeriodOverPeriodMetric'
    );

    // 生成当前周期CTE和对比周期CTE
    const currentCTESQL = this.generateCurrentPeriodCTE(query, popMetrics);
    const comparisonCTESQL = this.generateComparisonPeriodCTE(query, popMetrics);

    // 生成优化的主查询
    const mainQuerySQL = this.generateFinalOptimizedMainQuery(query, regularMetrics, popMetrics);

    // 组合完整的SQL
    return `WITH ${currentCTESQL},\n${comparisonCTESQL}\n${mainQuerySQL}`;
  }

  /**
   * 分阶段聚合：先在内层按维度计算基础指标（包括行级和算术的行表达式再聚合），
   * 然后外层基于内层聚合列做后聚合与算术计算。
   */
  private static generateWithPreAggregationCTE(originalQuery: Query): string {
    const innerName = 'inner_metrics';

    // dims
    const selectItems: string[] = [];
    let columnIndex = 1;

    originalQuery.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const mainTableAlias = this.resolveTableAlias(originalQuery.mainTable);
      const fieldInMain = originalQuery.mainTable.getField(dim.field.name);
      let fieldSQL = dim.field.getFullName();
      if (fieldInMain) {
        fieldSQL = dim.field.getFullName(mainTableAlias);
      } else {
        for (const join of originalQuery.joins) {
          const joinAlias = this.resolveTableAlias(join.rightTable);
          const f = join.rightTable.getField(dim.field.name);
          if (f) {
            fieldSQL = dim.field.getFullName(joinAlias);
            break;
          }
        }
      }
      selectItems.push(`${fieldSQL} AS ${englishAlias}`);
      columnIndex++;
    });

    // base metrics: 仅包含直接能在 inner 层聚合的指标（AggregateMetric, RowLevelMetric）
    const baseMetrics = originalQuery.metrics.filter(m =>
      (m instanceof AggregateMetric) || (m instanceof RowLevelMetric)
    );

    baseMetrics.forEach(metric => {
      const englishAlias = `column_${columnIndex}`;
      let metricSQL = metric.toSQL();
      // 如果有 JOIN，修复字段引用
      if (originalQuery.joins.length > 0) {
        metricSQL = this.fixMetricFieldReferences(metricSQL, originalQuery);
      }

      // 对于行级或算术指标，内层按行表达式聚合（SUM）
      if (metric instanceof RowLevelMetric) {
        metricSQL = `SUM(${metricSQL})`;
      }

      selectItems.push(`${metricSQL} AS ${englishAlias}`);
      columnIndex++;
    });

    const selectSQL = selectItems.join(', ');

    const fromSQL = this.generateFromClause(originalQuery);
    const joinSQL = this.generateJoinClause(originalQuery);
    const baseWhereSQL = this.generateWhereClause(originalQuery);
    // group by dims
    const groupBySQL = originalQuery.dimensions.length > 0 ? originalQuery.dimensions.map(d => {
      // reuse resolve logic
      const mainTableAlias = this.resolveTableAlias(originalQuery.mainTable);
      const fieldInMain = originalQuery.mainTable.getField(d.field.name);
      if (fieldInMain) return d.field.getFullName(mainTableAlias);
      for (const join of originalQuery.joins) {
        const ja = this.resolveTableAlias(join.rightTable);
        if (join.rightTable.getField(d.field.name)) return d.field.getFullName(ja);
      }
      return d.field.getFullName();
    }).join(', ') : '';

    // inner CTE SQL
    let innerSQL = `${innerName} AS (\n  SELECT ${selectSQL}\n  FROM ${fromSQL}`;
    if (joinSQL) innerSQL += `\n  ${joinSQL}`;
    if (baseWhereSQL) innerSQL += `\n  WHERE ${baseWhereSQL}`;
    if (groupBySQL) innerSQL += `\n  GROUP BY ${groupBySQL}`;
    innerSQL += `\n)`;

    // outer select: dims 从 inner_metrics 读取，baseMetrics 也从 inner_metrics 的 column_x 读取
    const outerSelectItems: string[] = [];
    let outerColIdx = 1;
    // dims
    originalQuery.dimensions.forEach(() => {
      outerSelectItems.push(`${innerName}.column_${outerColIdx} AS column_${outerColIdx}`);
      outerColIdx++;
    });

    // map base metric -> column index (in inner)
    const baseMetricStart = originalQuery.dimensions.length + 1;
    const baseMetricColumnFor = new Map<any, number>();
    baseMetrics.forEach((m, i) => {
      baseMetricColumnFor.set(m, baseMetricStart + i);
    });

    // 原始 metrics 中的最终输出项
    originalQuery.metrics.forEach(metric => {
      const englishAlias = `column_${outerColIdx}`;

      if (baseMetricColumnFor.has(metric)) {
        const idx = baseMetricColumnFor.get(metric);
        outerSelectItems.push(`${innerName}.column_${idx} AS ${englishAlias} /* ${metric.getDisplayName()} */`);
      } else {
        // 非 base metric（如 SubQueryMetric/PostAggregateMetric），保持原有生成逻辑
        // 如果是 算术指标，优先基于 inner_metrics 的列来组装表达式
        let metricSQL: string;
        if (metric instanceof ArithmeticMetric) {
          const leftOp = (metric as any).leftMetric;
          const rightOp = (metric as any).rightOperand;
          const operator = (metric as any).operator || '/';

          const resolveOperandToInner = (op: any): string => {
            if (op === null || op === undefined) return 'NULL';
            if (typeof op === 'number') return String(op);
            // if it's a Metric instance that exists in baseMetrics, reference inner column
            for (const [bm, idx] of baseMetricColumnFor.entries()) {
              if (bm === op || bm.name === op.name) return `${innerName}.column_${idx}`;
            }
            // fallback to op.toSQL if available
            if (typeof op.toSQL === 'function') {
              return op.toSQL();
            }
            if (op.getFullName) return op.getFullName();
            return String(op);
          };

          const leftSql = resolveOperandToInner(leftOp);
          const rightSql = resolveOperandToInner(rightOp);
          metricSQL = `(${leftSql} ${operator} ${rightSql})`;
        } else if (metric.constructor.name === 'SubQueryMetric') {
          metricSQL = `(${(metric as any).generateSubQuerySQL(this.buildQueryContext(originalQuery))})`;
        } else {
          metricSQL = metric.toSQL();
        }

        // 如果有 JOIN，修复字段引用（对子查询跳过）
        if (originalQuery.joins.length > 0 && metric.constructor.name !== 'SubQueryMetric') {
          metricSQL = this.fixMetricFieldReferences(metricSQL, originalQuery);
        }

        outerSelectItems.push(`${metricSQL} AS ${englishAlias} /* ${metric.getDisplayName()} */`);
      }

      outerColIdx++;
    });

    const outerSelectSQL = outerSelectItems.join(', ');

    const finalSQL = `WITH ${innerSQL}\nSELECT ${outerSelectSQL}\nFROM ${innerName}`;
    return finalSQL;
  }

  /**
   * 生成当前周期CTE
   */
  private static generateCurrentPeriodCTE(originalQuery: Query, popMetrics: any[]): string {
    const cteName = 'current_metrics';

    // 生成SELECT子句（包含维度和所有基础指标）
    const selectItems: string[] = [];
    let columnIndex = 1;

    // 添加维度
    originalQuery.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = dim.alias || dim.field.name;

      // 在CTE中，需要明确指定表别名来避免字段歧义
      let fieldSQL = dim.field.getFullName(); // 默认值
        const mainTableAlias = this.resolveTableAlias(originalQuery.mainTable);
      const fieldInMainTable = originalQuery.mainTable.getField(dim.field.name);

      if (fieldInMainTable) {
        // 字段在主表中
        fieldSQL = dim.field.getFullName(mainTableAlias);
      } else {
        // 尝试在JOIN表中查找
        let foundInJoin = false;
        for (const join of originalQuery.joins) {
          const joinTableAlias = this.resolveTableAlias(join.rightTable);
          const fieldInJoinTable = join.rightTable.getField(dim.field.name);
          if (fieldInJoinTable) {
            fieldSQL = dim.field.getFullName(joinTableAlias);
            foundInJoin = true;
            break;
          }
        }
        // 如果都没找到，使用不带表别名的字段名
        if (!foundInJoin) {
          fieldSQL = dim.field.getFullName();
        }
      }

      selectItems.push(`${fieldSQL} AS ${englishAlias} /* ${chineseName} */`);
      columnIndex++;
    });

    // 获取所有唯一的baseMetric，为每个添加聚合列
    const uniqueBaseMetrics = new Set<string>();
    popMetrics.forEach(popMetric => {
      uniqueBaseMetrics.add(popMetric.baseMetric.name);
    });

    uniqueBaseMetrics.forEach(metricName => {
      const popMetric = popMetrics.find(m => m.baseMetric.name === metricName);
      if (popMetric) {
        const englishAlias = `column_${columnIndex}`;
        const chineseName = popMetric.baseMetric.getDisplayName();
        let metricSQL = popMetric.baseMetric.toSQL();

        // 在CTE中，确保指标中的字段引用包含表别名
        if (originalQuery.joins.length > 0) {
          metricSQL = this.fixMetricFieldReferences(metricSQL, originalQuery);
        }

        selectItems.push(`${metricSQL} AS ${englishAlias} /* ${chineseName} */`);
        columnIndex++;
      }
    });

    const selectSQL = selectItems.join(', ');

    // 生成FROM和JOIN
    const fromSQL = this.generateFromClause(originalQuery);
    const joinSQL = this.generateJoinClause(originalQuery);
    const baseWhereSQL = this.generateWhereClause(originalQuery);
    const groupBySQL = this.generateGroupByClause(originalQuery);

    // 生成当前周期的时间筛选条件
    const firstPopMetric = popMetrics[0];
    const currentTimeFilter = this.createTimeFilter(
      firstPopMetric.timeField,
      firstPopMetric.periodType,
      0
    );
    const currentWhereSQL = currentTimeFilter.toSQL();

    const whereParts = [baseWhereSQL, currentWhereSQL].filter(w => w && w.trim() !== '');
    const whereSQL = whereParts.length > 0 ? whereParts.join(' AND ') : '';

    // 生成CTE
    let sql = `${cteName} AS (\n`;
    sql += `  SELECT ${selectSQL}\n`;
    sql += `  FROM ${fromSQL}`;

    if (joinSQL) {
      sql += `\n  ${joinSQL}`;
    }

    if (whereSQL) {
      sql += `\n  WHERE ${whereSQL}`;
    }

    if (groupBySQL) {
      sql += `\n  GROUP BY ${groupBySQL}`;
    }

    sql += `\n)`;

    return sql;
  }

  /**
   * 生成对比周期CTE
   */
  private static generateComparisonPeriodCTE(originalQuery: Query, popMetrics: any[]): string {
    const cteName = 'comparison_metrics';

    // 生成SELECT子句（包含维度和所有基础指标）
    const selectItems: string[] = [];
    let columnIndex = 1;

    // 添加维度
    originalQuery.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = dim.alias || dim.field.name;

      // 在CTE中，需要明确指定表别名来避免字段歧义
      let fieldSQL = dim.field.getFullName(); // 默认值
      const mainTableAlias = originalQuery.mainTable.alias || originalQuery.mainTable.name;
      const fieldInMainTable = originalQuery.mainTable.getField(dim.field.name);

      if (fieldInMainTable) {
        // 字段在主表中
        fieldSQL = dim.field.getFullName(mainTableAlias);
      } else {
        // 尝试在JOIN表中查找
        let foundInJoin = false;
        for (const join of originalQuery.joins) {
          const joinTableAlias = join.rightTable.alias || join.rightTable.name;
          const fieldInJoinTable = join.rightTable.getField(dim.field.name);
          if (fieldInJoinTable) {
            fieldSQL = dim.field.getFullName(joinTableAlias);
            foundInJoin = true;
            break;
          }
        }
        // 如果都没找到，使用不带表别名的字段名
        if (!foundInJoin) {
          fieldSQL = dim.field.getFullName();
        }
      }

      selectItems.push(`${fieldSQL} AS ${englishAlias} /* ${chineseName} */`);
      columnIndex++;
    });

    // 获取所有唯一的baseMetric，为每个添加聚合列
    const uniqueBaseMetrics = new Set<string>();
    popMetrics.forEach(popMetric => {
      uniqueBaseMetrics.add(popMetric.baseMetric.name);
    });

    uniqueBaseMetrics.forEach(metricName => {
      const popMetric = popMetrics.find(m => m.baseMetric.name === metricName);
      if (popMetric) {
        const englishAlias = `column_${columnIndex}`;
        const chineseName = popMetric.baseMetric.getDisplayName();
        let metricSQL = popMetric.baseMetric.toSQL();

        // 在CTE中，确保指标中的字段引用包含表别名
        if (originalQuery.joins.length > 0) {
          metricSQL = this.fixMetricFieldReferences(metricSQL, originalQuery);
        }

        selectItems.push(`${metricSQL} AS ${englishAlias} /* ${chineseName} */`);
        columnIndex++;
      }
    });

    const selectSQL = selectItems.join(', ');

    // 生成FROM和JOIN
    const fromSQL = this.generateFromClause(originalQuery);
    const joinSQL = this.generateJoinClause(originalQuery);
    const baseWhereSQL = this.generateWhereClause(originalQuery);
    const groupBySQL = this.generateGroupByClause(originalQuery);

    // 生成对比周期的时间筛选条件
    const firstPopMetric = popMetrics[0];
    const comparisonTimeFilter = this.createTimeFilter(
      firstPopMetric.timeField,
      firstPopMetric.periodType,
      firstPopMetric.getPeriodOffset()
    );
    const comparisonWhereSQL = comparisonTimeFilter.toSQL();

    const whereParts = [baseWhereSQL, comparisonWhereSQL].filter(w => w && w.trim() !== '');
    const whereSQL = whereParts.length > 0 ? whereParts.join(' AND ') : '';

    // 生成CTE
    let sql = `${cteName} AS (\n`;
    sql += `  SELECT ${selectSQL}\n`;
    sql += `  FROM ${fromSQL}`;

    if (joinSQL) {
      sql += `\n  ${joinSQL}`;
    }

    if (whereSQL) {
      sql += `\n  WHERE ${whereSQL}`;
    }

    if (groupBySQL) {
      sql += `\n  GROUP BY ${groupBySQL}`;
    }

    sql += `\n)`;

    return sql;
  }

  /**
   * 生成最终优化的主查询（完全避免子查询重复）
   */
  private static generateFinalOptimizedMainQuery(
    originalQuery: Query,
    regularMetrics: any[],
    popMetrics: any[]
  ): string {
    const selectItems: string[] = [];
    let columnIndex = 1;

    // 添加维度（从当前CTE中选择）
    originalQuery.dimensions.forEach(dim => {
      const englishAlias = `column_${columnIndex}`;
      const chineseName = dim.alias || dim.field.name;
      selectItems.push(`current_metrics.${englishAlias} AS ${englishAlias} /* ${chineseName} */`);
      columnIndex++;
    });

    // 添加PeriodOverPeriod指标（直接使用JOIN后的字段）
    popMetrics.forEach(popMetric => {
      // 计算当前指标对应的英文别名（在CTE中的位置）
      const baseMetricColumnIndex = originalQuery.dimensions.length +
        Array.from(new Set(popMetrics.map(m => m.baseMetric.name))).indexOf(popMetric.baseMetric.name) + 1;
      const currentValue = `current_metrics.column_${baseMetricColumnIndex}`;
      const comparisonValue = `comparison_metrics.column_${baseMetricColumnIndex}`;

      // 生成同环比计算表达式
      const popExpression = this.generatePeriodOverPeriodExpressionFromJoin(
        popMetric,
        currentValue,
        comparisonValue
      );

      const englishAlias = `column_${columnIndex}`;
      const chineseName = popMetric.getDisplayName();
      selectItems.push(`${popExpression} AS ${englishAlias} /* ${chineseName} */`);
      columnIndex++;
    });

    // 生成FROM子句和JOIN
    let sql = `SELECT ${selectItems.join(', ')}\n`;
    sql += `FROM current_metrics\n`;
    sql += `LEFT JOIN comparison_metrics ON `;

    // 生成JOIN条件（使用英文别名）
    const joinConditions = originalQuery.dimensions
      .map((dim, index) => `current_metrics.column_${index + 1} = comparison_metrics.column_${index + 1}`)
      .join(' AND ');

    sql += joinConditions;

    return sql;
  }


  /**
   * 从JOIN结果生成同环比表达式（最终优化版本）
   */
  private static generatePeriodOverPeriodExpressionFromJoin(
    popMetric: any,
    currentValue: string,
    comparisonValue: string
  ): string {
    if (popMetric.calculationMode === 'PERCENTAGE') {
      return `CASE
                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                WHEN ${comparisonValue} = 0 THEN 'INF'
                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                END`;
    } else if (popMetric.calculationMode === 'ABSOLUTE') {
      // 对于绝对值，即使对比值为NULL也要返回当前值（表示新增）
      return `COALESCE(${currentValue} - ${comparisonValue}, ${currentValue})`;
    } else { // BOTH
      const percentageExpr = `CASE
                                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                                WHEN ${comparisonValue} = 0 THEN 'INF'
                                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                                END`;
      // 对于绝对值部分，即使对比值为NULL也要返回当前值（表示新增）
      const absoluteExpr = `COALESCE(${currentValue} - ${comparisonValue}, ${currentValue})`;
      return `CONCAT(${percentageExpr}, '|', ${absoluteExpr})`;
    }
  }

  /**
   * 从子查询生成同环比表达式（保留向后兼容）
   */
  private static generatePeriodOverPeriodExpressionFromSubquery(
    popMetric: any,
    mainTableAlias: string,
    comparisonSubquery: string
  ): string {
    const currentValue = `${mainTableAlias}.${popMetric.baseMetric.getDisplayName()}`;
    const comparisonValue = `(${comparisonSubquery})`;

    if (popMetric.calculationMode === 'PERCENTAGE') {
      return `CASE
                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                WHEN ${comparisonValue} = 0 THEN 'INF'
                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                END`;
    } else if (popMetric.calculationMode === 'ABSOLUTE') {
      // 对于绝对值，即使对比值为NULL也要返回当前值（表示新增）
      return `COALESCE(${currentValue} - ${comparisonValue}, ${currentValue})`;
    } else { // BOTH
      const percentageExpr = `CASE
                                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                                WHEN ${comparisonValue} = 0 THEN 'INF'
                                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                                END`;
      // 对于绝对值部分，即使对比值为NULL也要返回当前值（表示新增）
      const absoluteExpr = `COALESCE(${currentValue} - ${comparisonValue}, ${currentValue})`;
      return `CONCAT(${percentageExpr}, '|', ${absoluteExpr})`;
    }
  }

  /**
   * 从CTE生成同环比表达式（优化NULL值处理）
   */
  private static generatePeriodOverPeriodExpressionFromCTE(
    popMetric: any,
    currentCTE: string,
    comparisonCTE: string
  ): string {
    const currentValue = `${currentCTE}.${popMetric.baseMetric.getDisplayName()}`;
    const comparisonValue = `${comparisonCTE}.${popMetric.baseMetric.getDisplayName()}`;

    if (popMetric.calculationMode === 'PERCENTAGE') {
      // 优化NULL值处理：
      // - comparison_value IS NULL: 新出现项目，返回'NEW'
      // - comparison_value = 0: 除零错误，返回'INF'
      // - 其他情况：正常计算百分比
      return `CASE
                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                WHEN ${comparisonValue} = 0 THEN 'INF'
                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                END`;
    } else if (popMetric.calculationMode === 'ABSOLUTE') {
      return `(${currentValue} - ${comparisonValue})`;
    } else { // BOTH
      // 优化CONCAT逻辑：直接处理NULL情况，避免复杂的COALESCE嵌套
      const percentageExpr = `CASE
                                WHEN ${comparisonValue} IS NULL THEN 'NEW'
                                WHEN ${comparisonValue} = 0 THEN 'INF'
                                ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2)
                                END`;
      const absoluteExpr = `(${currentValue} - ${comparisonValue})`;
      return `CONCAT(${percentageExpr}, '|', ${absoluteExpr})`;
    }
  }

  /**
   * 生成同环比查询
   */
  private static generatePeriodOverPeriodQueries(query: Query): any[] {
    const popQueries: any[] = [];

    query.metrics.forEach(metric => {
      if (metric.constructor.name === 'PeriodOverPeriodMetric') {
        const popMetric = metric as any; // TypeScript类型限制，实际是PeriodOverPeriodMetric

        // 生成当前周期查询
        const currentQuery = this.createPeriodQuery(query, popMetric, 0);
        const currentSQL = this.generateSelect(currentQuery);

        // 生成对比周期查询
        const comparisonQuery = this.createPeriodQuery(query, popMetric, popMetric.getPeriodOffset());
        const comparisonSQL = this.generateSelect(comparisonQuery);

        popQueries.push({
          metricName: popMetric.name,
          periodType: popMetric.periodType,
          calculationMode: popMetric.calculationMode,
          currentSQL,
          comparisonSQL
        });
      }
    });

    return popQueries;
  }

  /**
   * 创建指定周期的查询
   */
  private static createPeriodQuery(originalQuery: Query, popMetric: any, periodOffset: number): Query {
    // 创建时间筛选条件
    const timeFilter = this.createTimeFilter(popMetric.timeField, popMetric.periodType, periodOffset);

    // 移除原查询中的同环比指标，添加基础指标
    const baseMetrics = originalQuery.metrics.filter(metric =>
      !(metric.constructor.name === 'PeriodOverPeriodMetric')
    );

    return new Query(
      originalQuery.mainTable,
      originalQuery.dimensions,
      [...baseMetrics, popMetric.baseMetric], // 添加基础指标
      [...originalQuery.filters, timeFilter],
      originalQuery.joins
    );
  }

  /**
   * 创建时间筛选条件（用于CTE）
   */
  private static createTimeFilter(timeField: any, periodType: any, offset: number): any {
    // 返回一个模拟Filter对象，具有toSQL方法，使用日期函数进行精确的月份筛选
    return {
      toSQL: () => {
        const timeFieldExpr = timeField.name;
        switch (periodType) {
          case 'mom': // MONTH_OVER_MONTH
            if (offset === 0) {
              // 当前月
              return `DATE_FORMAT(${timeFieldExpr}, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`;
            } else {
              // 对比月（通常是上个月）
              return `DATE_FORMAT(${timeFieldExpr}, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} MONTH), '%Y-%m')`;
            }
          case 'yoy': // YEAR_OVER_YEAR
            if (offset === 0) {
              // 今年
              return `YEAR(${timeFieldExpr}) = YEAR(CURDATE())`;
            } else {
              // 去年同期
              return `YEAR(${timeFieldExpr}) = YEAR(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} YEAR))`;
            }
          case 'wow': // WEEK_OVER_WEEK
            if (offset === 0) {
              // 本周
              return `YEARWEEK(${timeFieldExpr}, 1) = YEARWEEK(CURDATE(), 1)`;
            } else {
              // 上周
              return `YEARWEEK(${timeFieldExpr}, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} WEEK), 1)`;
            }
          case 'qoq': // QUARTER_OVER_QUARTER
            if (offset === 0) {
              // 本季度
              return `CONCAT(YEAR(${timeFieldExpr}), '-', QUARTER(${timeFieldExpr})) = CONCAT(YEAR(CURDATE()), '-', QUARTER(CURDATE()))`;
            } else {
              // 上季度
              return `CONCAT(YEAR(${timeFieldExpr}), '-', QUARTER(${timeFieldExpr})) = CONCAT(YEAR(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} MONTH)), '-', QUARTER(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} MONTH)))`;
            }
          case 'dod': // DAY_OVER_DAY
            if (offset === 0) {
              // 今天
              return `DATE(${timeFieldExpr}) = CURDATE()`;
            } else {
              // 昨天或其他天
              return `DATE(${timeFieldExpr}) = DATE_SUB(CURDATE(), INTERVAL ${Math.abs(offset)} DAY)`;
            }
          default:
            return '1=1'; // 默认不过滤
        }
      }
    };
  }

  /**
   * 修复指标中的字段引用，为JOIN查询添加表别名
   */
  private static fixMetricFieldReferences(metricSQL: string, query: Query): string {
    // 简单的字段名模式匹配和替换
    // 这是一个简化实现，实际项目中可能需要更复杂的SQL解析

    let fixedSQL = metricSQL;

    // 获取所有可能的字段名（从所有表中）
    const allFields = new Map<string, string>();

    // 从主表添加字段
    query.mainTable.fields.forEach(field => {
      allFields.set(field.name, this.resolveTableAlias(query.mainTable));
    });

    // 从JOIN表添加字段
    query.joins.forEach(join => {
      join.rightTable.fields.forEach(field => {
        allFields.set(field.name, this.resolveTableAlias(join.rightTable));
      });
    });

    // 替换字段引用
    // 使用正则表达式匹配单词边界内的字段名
    allFields.forEach((tableAlias, fieldName) => {
      const regex = new RegExp(`\\b${fieldName}\\b`, 'g');
      fixedSQL = fixedSQL.replace(regex, `${tableAlias}.${fieldName}`);
    });

    return fixedSQL;
  }
}