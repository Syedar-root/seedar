import { useMemo } from 'react';
import type { ThemeType } from '@seedar/ui-core';
import { DEFAULT_THEME } from '@seedar/ui-core';

export function useChartTheme(theme?: ThemeType) {
  const currentTheme = useMemo(() => theme ?? DEFAULT_THEME, [theme]);

  const themeConfig = useMemo(() => {
    return {
      name: currentTheme,
    };
  }, [currentTheme]);

  return {
    theme: currentTheme,
    themeConfig,
  };
}
