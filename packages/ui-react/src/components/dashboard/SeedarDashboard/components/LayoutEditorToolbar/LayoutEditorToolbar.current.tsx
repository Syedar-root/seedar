import React from "react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { SeedarBreakpoint } from "../../../../../utils/dashboard-layout/constants";

import { useLayoutEditorToolbarViewModel } from "./hooks/useLayoutEditorToolbarViewModel.hook";
import styles from "./LayoutEditorToolbar.module.css";

export const LayoutEditorToolbar: React.FC = () => {
  const viewModel = useLayoutEditorToolbarViewModel();
  const [scaleInputValue, setScaleInputValue] = useState("");

  useEffect(() => {
    if (!viewModel) {
      return;
    }

    setScaleInputValue(String(viewModel.viewportScaleInputValue));
  }, [viewModel?.viewportScaleInputValue]);

  if (!viewModel) {
    return null;
  }

  const commitScaleInput = (value: string) => {
    const scalePercent = Number(value);
    if (!Number.isFinite(scalePercent)) {
      setScaleInputValue(String(viewModel.viewportScaleInputValue));
      return;
    }

    viewModel.actions.setViewportScale(scalePercent / 100);
  };

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
            <div className={styles.scaleControl}>
              <button
                type="button"
                className={clsx(
                  styles.scaleAutoButton,
                  viewModel.viewportScaleMode === "auto" &&
                    styles.scaleAutoButtonActive,
                )}
                onClick={() => viewModel.actions.setViewportScaleMode("auto")}
                title={`当前自适应 ${viewModel.viewportScaleLabel}`}
              >
                自适应
              </button>
              <input
                type="number"
                className={styles.scaleInput}
                min={viewModel.minViewportScalePercent}
                max={viewModel.maxViewportScalePercent}
                step={1}
                value={scaleInputValue}
                onChange={(event) => {
                  setScaleInputValue(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitScaleInput(event.currentTarget.value);
                    event.currentTarget.blur();
                  }

                  if (event.key === "Escape") {
                    setScaleInputValue(
                      String(viewModel.viewportScaleInputValue),
                    );
                    event.currentTarget.blur();
                  }
                }}
                onBlur={(event) => {
                  if (event.target.value === "") {
                    setScaleInputValue(String(viewModel.viewportScaleInputValue));
                    return;
                  }

                  commitScaleInput(event.target.value);
                }}
                aria-label="缩放百分比"
              />
              <span className={styles.scaleSuffix}>%</span>
            </div>
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
