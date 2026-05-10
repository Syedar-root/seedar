import {
  optionalUtcTimeTransformer,
  utcTimeTransformer,
} from './utc-time.transformer';

describe('UTC时间转换器', () => {
  it('正常流程：将 UTC 字符串转换为 Date', () => {
    const result = utcTimeTransformer.from('2024-01-01T00:00:00');

    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('正常流程：UTC 标准字符串语义保持不变', () => {
    const result = utcTimeTransformer.from('2024-01-01T00:00:00.000Z');

    expect(result?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('正常流程：Date 实例透传并输出 UTC 字符串', () => {
    const date = new Date('2024-02-03T04:05:06.000Z');

    expect(utcTimeTransformer.from(date)).toBe(date);
    expect(utcTimeTransformer.to(date)).toBe('2024-02-03T04:05:06.000Z');
  });

  it('异常边界：空值返回 null', () => {
    expect(utcTimeTransformer.from(null)).toBeNull();
    expect(utcTimeTransformer.to(null)).toBeNull();
  });
});

describe('可选UTC时间转换器', () => {
  it('异常边界：可选转换器保留空值', () => {
    expect(optionalUtcTimeTransformer.from(undefined)).toBeUndefined();
    expect(optionalUtcTimeTransformer.to(undefined)).toBeUndefined();
    expect(optionalUtcTimeTransformer.from(null)).toBeNull();
    expect(optionalUtcTimeTransformer.to(null)).toBeNull();
  });
});
