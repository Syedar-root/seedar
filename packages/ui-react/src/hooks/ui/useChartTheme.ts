import { useMemo } from 'react';

type ThemeType = 'light' | 'dark';

const DEFAULT_THEME: ThemeType = 'light';

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
