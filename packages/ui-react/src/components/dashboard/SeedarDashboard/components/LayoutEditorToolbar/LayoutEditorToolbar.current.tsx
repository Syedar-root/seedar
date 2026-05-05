import React from "react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Button } from "@base-ui/react/button";
import { NumberField } from "@base-ui/react/number-field";
import { Select } from "@base-ui/react/select";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { SeedarBreakpoint } from "../../../../../utils/dashboard-layout/constants";

import { useLayoutEditorToolbarViewModel } from "./hooks/useLayoutEditorToolbarViewModel.hook";
import tokenStyles from "../../SeedarDashboard.tokens.module.css";
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
          <ToggleGroup
            className={styles.breakpoints}
            value={[viewModel.activeBreakpoint]}
            onValueChange={(values) => {
              const [breakpoint] = values;

              if (breakpoint) {
                viewModel.actions.setActiveBreakpoint(breakpoint);
              }
            }}
            aria-label="设备断点"
          >
            {viewModel.breakpoints.map((item: {
              breakpoint: SeedarBreakpoint;
              configured: boolean;
              isActive: boolean;
              range: string;
            }) => (
              <Toggle
                key={item.breakpoint}
                type="button"
                value={item.breakpoint}
                pressed={item.isActive}
                className={clsx(
                  styles.breakpointButton,
                  item.isActive && styles.breakpointButtonActive,
                )}
                title={item.range}
              >
                <span>{item.breakpoint.toUpperCase()}</span>
                <span className={styles.breakpointMeta}>
                  {item.configured ? "独立" : "继承"}
                </span>
              </Toggle>
            ))}
          </ToggleGroup>
        </div>

        <div className={styles.deviceSecondary}>
          <div className={styles.metrics}>
            <span className={styles.metric}>容器 {viewModel.widthText}</span>
            <span className={styles.metric}>画布 {viewModel.effectiveGridWidthText}</span>
          </div>

          <label className={styles.widthPicker}>
            <span className={styles.label}>预览宽度</span>
            <Select.Root
              value={viewModel.lockedCanvasWidth}
              onValueChange={(value) => {
                if (value !== null) {
                  viewModel.actions.setLockedCanvasWidth(value);
                }
              }}
            >
              <Select.Trigger className={styles.select}>
                <Select.Value />
                <Select.Icon className={styles.selectIcon}>⌄</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  className={styles.selectPositioner}
                  sideOffset={4}
                  align="start"
                >
                  <Select.Popup
                    className={clsx(
                      tokenStyles["token-scope"],
                      styles.selectPopup,
                    )}
                  >
                    <Select.List className={styles.selectList}>
                      {viewModel.lockedWidthOptions.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          className={styles.selectItem}
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                          <Select.ItemIndicator className={styles.selectItemIndicator}>
                            ✓
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </label>

          <label className={styles.widthPicker}>
            <span className={styles.label}>缩放</span>
            <NumberField.Root
              className={styles.scaleControl}
              value={scaleInputValue === "" ? null : Number(scaleInputValue)}
              min={viewModel.minViewportScalePercent}
              max={viewModel.maxViewportScalePercent}
              step={1}
              allowOutOfRange
              onValueChange={(value) => {
                setScaleInputValue(value === null ? "" : String(value));
              }}
              onValueCommitted={(value) => {
                if (value === null) {
                  setScaleInputValue(String(viewModel.viewportScaleInputValue));
                  return;
                }

                viewModel.actions.setViewportScale(value / 100);
              }}
            >
              <Button
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
              </Button>
              <NumberField.Input
                className={styles.scaleInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.currentTarget.value !== "") {
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
              <div className={styles.scaleStepper}>
                <NumberField.Increment className={styles.scaleStepButton}>
                  +
                </NumberField.Increment>
                <NumberField.Decrement className={styles.scaleStepButton}>
                  -
                </NumberField.Decrement>
              </div>
            </NumberField.Root>
          </label>

          <Button
            type="button"
            className={styles.secondaryButton}
            onClick={viewModel.actions.copyActiveBreakpointToOthers}
            disabled={viewModel.copyDisabled}
          >
            同步到其它断点
          </Button>
        </div>
      </div>

      <div className={styles.helperStack}>
        <p className={styles.helperText}>{viewModel.helperText}</p>
        <p className={styles.helperText}>{viewModel.viewportHint}</p>
      </div>
    </div>
  );
};
