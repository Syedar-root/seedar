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
      <div className={styles.deviceBar}>
        <div className={styles.devicePrimary}>
          <span className={styles.label}>设备断点</span>
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
                title={item.range}
              >
                <span>{item.breakpoint.toUpperCase()}</span>
                <span className={styles.breakpointMeta}>
                  {item.configured ? "独立" : "继承"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.deviceSecondary}>
          <div className={styles.metrics}>
            <span className={styles.metric}>容器 {viewModel.widthText}</span>
            <span className={styles.metric}>画布 {viewModel.effectiveGridWidthText}</span>
          </div>

          <label className={styles.widthPicker}>
            <span className={styles.label}>预览宽度</span>
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

          <label className={styles.widthPicker}>
            <span className={styles.label}>缩放</span>
            <select
              value={
                viewModel.viewportScaleMode === "auto"
                  ? "auto"
                  : String(viewModel.viewportScale)
              }
              className={styles.select}
              onChange={(event) => {
                if (event.target.value === "auto") {
                  viewModel.actions.setViewportScaleMode("auto");
                  return;
                }

                viewModel.actions.setViewportScale(Number(event.target.value));
              }}
            >
              <option value="auto">
                自适应 / {viewModel.viewportScaleLabel}
              </option>
              {viewModel.viewportScaleOptions.map((option) => (
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
            同步到其它断点
          </button>
        </div>
      </div>

      <div className={styles.helperStack}>
        <p className={styles.helperText}>{viewModel.helperText}</p>
        <p className={styles.helperText}>{viewModel.viewportHint}</p>
      </div>
    </div>
  );
};
