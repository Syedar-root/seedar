import React from "react";
import clsx from "clsx";

import { useSeedarDashboardContext } from "../../seedarDashboardContext";
import { BREAKPOINT_ORDER, type SeedarBreakpoint } from "../../const";
import { getBreakpointSummaryLabel } from "../../layoutEditor";
import styles from "./layoutEditorToolbar.module.css";

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

  const helperText = activeBreakpointConfigured
    ? `当前对 ${getBreakpointSummaryLabel(state.activeBreakpoint)} 的拖拽和缩放，只会保存到这个断点。`
    : state.activeBreakpointSource
      ? `${getBreakpointSummaryLabel(state.activeBreakpoint)} 还没有独立布局，当前参考的是 ${getBreakpointSummaryLabel(state.activeBreakpointSource)}。拖拽后会写入当前断点。`
      : `${getBreakpointSummaryLabel(state.activeBreakpoint)} 还没有布局数据，添加 panel 或拖拽后会创建独立布局。`;

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.metrics}>
          <span className={styles.metric}>
            容器 {formatWidth(state.containerWidth)} ·{" "}
            {getBreakpointSummaryLabel(state.containerBreakpoint)}
          </span>
          <span className={styles.metric}>
            画布 {formatWidth(state.effectiveGridWidth)}
          </span>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <span className={styles.label}>编辑断点</span>
          <div className={styles.breakpoints}>
            {BREAKPOINT_ORDER.map((breakpoint) => {
              const configured = state.configuredBreakpoints.includes(breakpoint);
              const isActive = breakpoint === state.activeBreakpoint;

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
                    {configured ? "已配置" : "未配置"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className={styles.group}>
          <span className={styles.label}>编辑画布</span>
          <select
            value={state.lockedCanvasWidth}
            className={styles.select}
            onChange={(event) =>
              actions.setLockedCanvasWidth(Number(event.target.value))
            }
          >
            {LOCKED_WIDTH_OPTIONS[state.activeBreakpoint].map((width) => (
              <option key={width} value={width}>
                {getBreakpointSummaryLabel(state.activeBreakpoint)} ·{" "}
                {formatWidth(width)}
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
          复制到其他断点
        </button>
      </div>

      <p className={styles.helperText}>{helperText}</p>
    </div>
  );
};
