/**
 * 格式化数字，添加千位分隔符
 * @param value - 待格式化的数字
 * @param decimals - 小数位数，默认为 0
 * @returns 格式化后的数字字符串
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化百分比
 * @param value - 待格式化的数值（0-1 之间的小数）
 * @param decimals - 小数位数，默认为 1
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化日期
 * @param date - 待格式化的日期，可以是 Date 对象、时间戳或日期字符串
 * @param format - 格式字符串，支持 'YYYY-MM-DD'、'YYYY/MM/DD'、'YYYY年MM月DD日'、'MM-DD'、'MM/DD' 等
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化货币
 * @param value - 待格式化的数值
 * @param currency - 货币代码，默认为 'CNY'（人民币）
 * @param decimals - 小数位数，默认为 2
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(value: number, currency: string = 'CNY', decimals: number = 2): string {
  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KRW: '₩',
    HKD: 'HK$',
    SGD: 'S$',
  };
  
  const symbol = currencySymbols[currency] || currency;
  const formattedNumber = formatNumber(value, decimals);
  
  return `${symbol}${formattedNumber}`;
}

/**
 * 格式化字节数
 * @param bytes - 待格式化的字节数
 * @param decimals - 小数位数，默认为 2
 * @returns 格式化后的字节数字符串（如 '1.5 KB'、'2.3 MB' 等）
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) {
    return '0 B';
  }
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * 格式化时长
 * @param seconds - 待格式化的秒数
 * @returns 格式化后的时长字符串（如 '1h 30m 45s'、'45s' 等）
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    return '0s';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }
  
  return parts.join(' ');
}
