export function validateData(data: any[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  return data.every((item) => typeof item === 'object' && item !== null);
}

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
