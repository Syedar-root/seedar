import React from "react";
import clsx from "clsx";
import type { SeedarBreakpoint } from "../../../../../utils/dashboard-layout/constants";

import { useLayoutEditorToolbarViewModel } from "./hooks/useLayoutEditorToolbarViewModel.hook";
import styles from "./LayoutEditorToolbar.module.css";

export const LayoutEditorToolbar: React.FC = () => {
  const viewModel = useLayoutEditorToolbarViewModel();

  if (!viewModel) {
    return null;
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.metrics}>
          <span className={styles.metric}>
            当前容器 {viewModel.widthText} / {viewModel.containerBreakpointLabel}
          </span>
          <span className={styles.metric}>
            编辑画布 {viewModel.effectiveGridWidthText}
          </span>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <span className={styles.label}>编辑布局版本</span>
          <div className={styles.breakpoints}>
            {viewModel.breakpoints.map((item: {
              breakpoint: SeedarBreakpoint;
              configured: boolean;
              isActive: boolean;
              range: string;
            }) => (
              <button
                key={item.breakpoint}
                type="button"
                className={clsx(
                  styles.breakpointButton,
                  item.isActive && styles.breakpointButtonActive,
                )}
                onClick={() => viewModel.actions.setActiveBreakpoint(item.breakpoint)}
              >
                <span>{item.breakpoint.toUpperCase()}</span>
                <span className={styles.breakpointMeta}>
                  {item.range} / {item.configured ? "已独立" : "未独立"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className={styles.group}>
          <span className={styles.label}>断点预览宽度</span>
          <select
            value={viewModel.lockedCanvasWidth}
            className={styles.select}
            onChange={(event) =>
              viewModel.actions.setLockedCanvasWidth(Number(event.target.value))
            }
          >
            {viewModel.lockedWidthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={viewModel.actions.copyActiveBreakpointToOthers}
          disabled={viewModel.copyDisabled}
        >
          复制布局到其它断点
        </button>
      </div>

      <div className={styles.helperStack}>
        <p className={styles.helperText}>{viewModel.helperText}</p>
        <p className={styles.helperText}>{viewModel.viewportHint}</p>
      </div>
    </div>
  );
};
