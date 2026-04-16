export const formatWidth = (width: number): string => `${Math.round(width)}px`;

export const getConfiguredLayoutHint = (
  breakpointLabel: string,
  breakpointRange: string,
): string =>
  `当前正在编辑 ${breakpointLabel} 的独立布局。它会在容器宽度落入 ${breakpointRange} 时生效，拖拽和缩放只会保存到这个断点。`;

export const getInheritedLayoutHint = (
  breakpointLabel: string,
  breakpointRange: string,
  sourceLabel: string,
): string =>
  `${breakpointLabel} 还没有独立布局。它本应在容器宽度落入 ${breakpointRange} 时生效；当前画布展示的是从 ${sourceLabel} 引用并按当前断点适配后的结果。只要开始拖拽、缩放或新增 Panel，就会创建这个断点自己的布局。`;

export const getEmptyLayoutHint = (
  breakpointLabel: string,
  breakpointRange: string,
): string =>
  `${breakpointLabel} 还没有布局数据。它会在容器宽度落入 ${breakpointRange} 时生效；新增 Panel 或开始拖拽后，会创建这个断点自己的布局。`;

export const getDifferentViewportHint = (
  containerLabel: string,
  containerRange: string,
  activeLabel: string,
): string =>
  `当前窗口实际命中的是 ${containerLabel}（${containerRange}），所以浏览模式会优先显示 ${containerLabel} 的布局。你现在是在同一个窗口里，主动编辑 ${activeLabel} 这份布局数据。`;

export const getSameViewportHint = (
  containerLabel: string,
  containerRange: string,
): string =>
  `当前窗口实际命中的就是 ${containerLabel}（${containerRange}），所以浏览模式和当前编辑断点是一致的。`;
