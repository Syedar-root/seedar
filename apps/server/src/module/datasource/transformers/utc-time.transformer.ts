/**
 * UTC时间转换器
 * 存储时：Date对象 -> UTC ISO字符串
 * 读取时：UTC字符串 -> Date对象
 */
export const utcTimeTransformer = {
  from: (value: string | Date | null): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    // 确保字符串是UTC格式，如果没有Z后缀则添加
    const dateString =
      typeof value === 'string' && !value.endsWith('Z') ? value + 'Z' : value;
    return new Date(dateString);
  },
  to: (value: Date | string | null): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;

    // 转换为UTC ISO字符串
    return value.toISOString();
  },
};

/**
 * 可选的UTC时间转换器（用于可选字段）
 */
export const optionalUtcTimeTransformer = {
  from: (value: string | Date | null | undefined): Date | null | undefined => {
    if (value == null) return value;
    return utcTimeTransformer.from(value);
  },
  to: (value: Date | string | null | undefined): string | null | undefined => {
    if (value == null) return value;
    return utcTimeTransformer.to(value);
  },
};
