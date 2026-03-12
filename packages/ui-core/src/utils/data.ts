/**
 * 验证数据是否为有效的对象数组
 * @param data - 待验证的数据
 * @returns 是否为有效的对象数组
 */
export function validateData(data: any[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  return data.every((item) => typeof item === 'object' && item !== null);
}

/**
 * 根据映射关系转换数据字段名
 * @param data - 待转换的数据数组
 * @param mapping - 字段映射关系，key 为原字段名，value 为新字段名
 * @returns 转换后的数据数组
 */
export function transformData(
  data: any[],
  mapping: Record<string, string>
): any[] {
  if (!validateData(data)) {
    return [];
  }
  return data.map((item) => {
    const transformed: Record<string, any> = {};
    for (const [key, newKey] of Object.entries(mapping)) {
      transformed[newKey] = item[key];
    }
    return transformed;
  });
}

/**
 * 根据条件过滤数据
 * @param data - 待过滤的数据数组
 * @param predicate - 过滤条件函数，返回 true 表示保留该元素
 * @returns 过滤后的数据数组
 */
export function filterData<T = any>(
  data: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(predicate);
}

/**
 * 根据指定字段对数据进行排序
 * @param data - 待排序的数据数组
 * @param key - 排序字段名
 * @param order - 排序顺序，'asc' 为升序，'desc' 为降序，默认为 'asc'
 * @returns 排序后的数据数组
 */
export function sortData<T = any>(
  data: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return [...data].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    
    if (valueA === valueB) return 0;
    
    if (valueA === null || valueA === undefined) return 1;
    if (valueB === null || valueB === undefined) return -1;
    
    const comparison = valueA > valueB ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * 根据指定字段对数据进行分组
 * @param data - 待分组的数据数组
 * @param key - 分组字段名
 * @returns 分组后的对象，key 为分组值，value 为对应的数据数组
 */
export function groupData<T = any>(
  data: T[],
  key: keyof T
): Record<string, T[]> {
  if (!Array.isArray(data)) {
    return {};
  }
  
  return data.reduce((groups, item) => {
    const groupKey = String(item[key] || 'undefined');
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 对数据进行聚合计算
 * @param data - 待聚合的数据数组
 * @param key - 聚合字段名
 * @param aggregator - 聚合函数类型：'sum' 求和、'avg' 平均值、'min' 最小值、'max' 最大值、'count' 计数
 * @returns 聚合结果
 */
export function aggregateData<T = any>(
  data: T[],
  key: keyof T,
  aggregator: 'sum' | 'avg' | 'min' | 'max' | 'count'
): number {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }
  
  const values: number[] = data
    .map((item) => item[key] as unknown)
    .filter((value): value is number => typeof value === 'number' && !isNaN(value));
  
  if (values.length === 0) {
    return 0;
  }
  
  switch (aggregator) {
    case 'sum':
      return values.reduce((sum, value) => sum + value, 0);
    case 'avg':
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    default:
      return 0;
  }
}

/**
 * 对数据进行分页
 * @param data - 待分页的数据数组
 * @param page - 页码，从 1 开始
 * @param pageSize - 每页数据量
 * @returns 分页后的数据数组
 */
export function paginateData<T = any>(
  data: T[],
  page: number,
  pageSize: number
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  if (page < 1 || pageSize < 1) {
    return [];
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return data.slice(startIndex, endIndex);
}
