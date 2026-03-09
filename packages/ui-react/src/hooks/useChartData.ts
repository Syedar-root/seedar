import { useMemo } from 'react';
import type { ChartData } from '@seedar/ui-core';
import { validateData } from '@seedar/ui-core';

export function useChartData(data: ChartData) {
  const isValid = useMemo(() => validateData(data), [data]);

  const processedData = useMemo(() => {
    if (!isValid) {
      return [];
    }
    return data;
  }, [data, isValid]);

  return {
    data: processedData,
    isValid,
  };
}
