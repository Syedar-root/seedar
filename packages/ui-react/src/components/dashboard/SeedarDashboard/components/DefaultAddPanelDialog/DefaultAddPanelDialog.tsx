import React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Radio, RadioGroup } from "@base-ui/react";
import clsx from "clsx";
import type { PanelResponse } from "#pkg/seedar/types";

import { SeedarPanel } from "../../../SeedarPanel";
import { useDefaultAddPanelDialogController } from "./hooks/useDefaultAddPanelDialogController.hook";
import type { DefaultAddPanelDialogProps } from "./types";
import {
  DEFAULT_ADD_PANEL_SCOPE_OPTIONS,
  getDefaultAddPanelDialogHint,
} from "./utils/getDefaultAddPanelDialogCopy";
import tokenStyles from "../../SeedarDashboard.tokens.module.css";
import styles from "./DefaultAddPanelDialog.module.css";

export const DefaultAddPanelDialog: React.FC<DefaultAddPanelDialogProps> = ({
  onClose,
}) => {
  const {
    activeBreakpointLabel,
    existingPanelIds,
    handlePanelSelect,
    isLoading,
    panels,
    scope,
    selectedPanelId,
    setScope,
    setSelectedPanelId,
  } = useDefaultAddPanelDialogController({ onClose });
  const id = React.useId();
  const hintText = getDefaultAddPanelDialogHint(activeBreakpointLabel);

  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.Backdrop} />
      <Dialog.Popup className={clsx(tokenStyles["token-scope"], styles.popup)}>
        <div className={styles.content}>
          <Dialog.Title className={styles.title}>选择 Panel</Dialog.Title>
          <Dialog.Description className={styles.description}>
            选择要添加到仪表盘的 Panel
          </Dialog.Description>
          <RadioGroup
            aria-labelledby={id}
            onValueChange={setSelectedPanelId}
            className={styles.panelList}
          >
            {isLoading ? (
              <div className={styles.loading}>加载中...</div>
            ) : !panels?.length ? (
              <div className={styles.loading}>暂无可添加的 Panel</div>
            ) : (
              panels.map((panel: PanelResponse) => (
                <div key={panel.id} className={styles.panelItem}>
                  <div className={styles.panelItemHeader}>
                    {existingPanelIds.has(panel.id) ? (
                      <span className={styles.addedText}>已添加</span>
                    ) : (
                      <Radio.Root value={panel.id} className={styles.Radio}>
                        <Radio.Indicator className={styles.Indicator} />
                      </Radio.Root>
                    )}
                    {panel.title || "未命名 Panel"}
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <SeedarPanel
                      style={{
                        padding: 0,
                        backgroundColor: "transparent",
                        border: "none",
                      }}
                      showHeader={false}
                      panelId={panel.id}
                    />
                  </div>
                </div>
              ))
            )}
          </RadioGroup>

          <div className={styles.scopeSection}>
            <div className={styles.scopeTitle}>添加范围</div>
            <div className={styles.scopeOptions}>
              {DEFAULT_ADD_PANEL_SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    styles.scopeButton,
                    scope === option.value && styles.scopeButtonActive,
                  )}
                  onClick={() => setScope(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className={styles.scopeHint}>{hintText}</p>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handlePanelSelect}
              className={clsx(styles.actionsButton, styles.addButton)}
              disabled={!selectedPanelId}
            >
              添加
            </button>
            <Dialog.Close
              className={clsx(styles.actionsButton, styles.closeButton)}
            >
              取消
            </Dialog.Close>
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  );
};
