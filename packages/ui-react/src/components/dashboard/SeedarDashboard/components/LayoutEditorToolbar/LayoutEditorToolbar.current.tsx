import React from "react";
import clsx from "clsx";

import { useSeedarDashboardContext } from "../../context/SeedarDashboardContext";
import {
  BREAKPOINT_ORDER,
  type SeedarBreakpoint,
} from "../../../../../utils/dashboard-layout/constants";
import {
  getBreakpointRangeLabel,
  getBreakpointSummaryLabel,
} from "../../../../../utils/dashboard-layout/layoutEditor";
import styles from "./LayoutEditorToolbar.module.css";

const formatWidth = (width: number): string => `${Math.round(width)}px`;

const LOCKED_WIDTH_OPTIONS: Record<SeedarBreakpoint, number[]> = {
  lg: [1200, 1440, 1600, 1920],
  md: [996, 1100, 1190],
  sm: [768, 820, 940],
  xs: [480, 560, 720],
  xxs: [320, 360, 440],
};

export const LayoutEditorToolbar: React.FC = () => {
  const { actions, state, mode } = useSeedarDashboardContext();

  if (mode === "view") {
    return null;
  }

  const activeBreakpointConfigured = state.configuredBreakpoints.includes(
    state.activeBreakpoint,
  );
  const copyDisabled =
    !state.activeBreakpointSource &&
    (state.localLayout[state.activeBreakpoint] ?? []).length === 0;
  const activeBreakpointLabel = getBreakpointSummaryLabel(state.activeBreakpoint);
  const activeBreakpointRange = getBreakpointRangeLabel(state.activeBreakpoint);
  const containerBreakpointLabel = getBreakpointSummaryLabel(
    state.containerBreakpoint,
  );
  const containerBreakpointRange = getBreakpointRangeLabel(
    state.containerBreakpoint,
  );
  const isEditingDifferentBreakpoint =
    state.activeBreakpoint !== state.containerBreakpoint;

  const helperText = activeBreakpointConfigured
    ? `当前正在编辑 ${activeBreakpointLabel} 的独立布局。它会在容器宽度落入 ${activeBreakpointRange} 时生效，当前的拖拽和缩放只会保存到这个断点。`
    : state.activeBreakpointSource
      ? `${activeBreakpointLabel} 还没有独立布局。它本来应该在容器宽度落入 ${activeBreakpointRange} 时使用；现在画布里展示的是从 ${getBreakpointSummaryLabel(state.activeBreakpointSource)} 引用并按当前断点适配后的结果。只要拖拽、缩放或新增 panel，就会创建这个断点自己的布局。`
      : `${activeBreakpointLabel} 还没有布局数据。它会在容器宽度落入 ${activeBreakpointRange} 时生效；新增 panel 或开始拖拽后，会创建这个断点自己的布局。`;

  const viewportHint = isEditingDifferentBreakpoint
    ? `当前窗口实际命中的是 ${containerBreakpointLabel}（${containerBreakpointRange}），所以浏览模式会优先显示 ${containerBreakpointLabel} 的布局。你现在是在同一个窗口里，主动编辑 ${activeBreakpointLabel} 这份布局数据。`
    : `当前窗口实际命中的就是 ${containerBreakpointLabel}（${containerBreakpointRange}），所以浏览模式和当前编辑断点是一致的。`;

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.metrics}>
          <span className={styles.metric}>
            当前容器 {formatWidth(state.containerWidth)} · {containerBreakpointLabel}
          </span>
          <span className={styles.metric}>
            编辑画布 {formatWidth(state.effectiveGridWidth)}
          </span>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <span className={styles.label}>编辑布局版本</span>
          <div className={styles.breakpoints}>
            {BREAKPOINT_ORDER.map((breakpoint) => {
              const configured = state.configuredBreakpoints.includes(breakpoint);
              const isActive = breakpoint === state.activeBreakpoint;
              const breakpointRange = getBreakpointRangeLabel(breakpoint);

              return (
                <button
                  key={breakpoint}
                  type="button"
                  className={clsx(
                    styles.breakpointButton,
                    isActive && styles.breakpointButtonActive,
                  )}
                  onClick={() => actions.setActiveBreakpoint(breakpoint)}
                >
                  <span>{breakpoint.toUpperCase()}</span>
                  <span className={styles.breakpointMeta}>
                    {breakpointRange} · {configured ? "已独立" : "未独立"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className={styles.group}>
          <span className={styles.label}>断点预览宽度</span>
          <select
            value={state.lockedCanvasWidth}
            className={styles.select}
            onChange={(event) =>
              actions.setLockedCanvasWidth(Number(event.target.value))
            }
          >
            {LOCKED_WIDTH_OPTIONS[state.activeBreakpoint].map((width) => (
              <option key={width} value={width}>
                {activeBreakpointLabel} · {formatWidth(width)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={actions.copyActiveBreakpointToOthers}
          disabled={copyDisabled}
        >
          复制布局到其他断点
        </button>
      </div>

      <div className={styles.helperStack}>
        <p className={styles.helperText}>{helperText}</p>
        <p className={styles.helperText}>{viewportHint}</p>
      </div>
    </div>
  );
};
