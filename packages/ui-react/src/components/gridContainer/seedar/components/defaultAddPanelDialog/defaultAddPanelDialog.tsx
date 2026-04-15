import React, { useCallback, useMemo } from "react";
import { useSeedarDashboardContext } from "../../seedarDashboardContext";
import { usePanels } from "../../../../../hooks";
import { Dialog } from "@base-ui/react/dialog";
import styles from "./defaultAddPanelDialog.module.css";
import { SeedarPanel } from "../../seedarPanel";
import { Radio, RadioGroup } from "@base-ui/react";
import clsx from "clsx";
import { DEFAULT_W, DEFAULT_H, type AddPanelScope } from "../../const";
import { getBreakpointSummaryLabel } from "../../layoutEditor";

interface DefaultAddPanelDialogProps {
  onClose: () => void;
}

export const DefaultAddPanelDialog: React.FC<DefaultAddPanelDialogProps> = ({
  onClose,
}) => {
  const { actions, data, state } = useSeedarDashboardContext();
  const { data: panels, isLoading } = usePanels();
  const [selectedPanelId, setSelectedPanelId] = React.useState<string>("");
  const [scope, setScope] = React.useState<AddPanelScope>("active");

  const handlePanelSelect = useCallback(() => {
    if (!selectedPanelId) return;
    actions.addPanel(selectedPanelId, {
      defaultSize: { w: DEFAULT_W, h: DEFAULT_H },
      scope,
    });
    onClose();
  }, [actions, onClose, scope, selectedPanelId]);

  const id = React.useId();

  const panelList = useMemo(() => {
    if (isLoading) return <div className={styles.loading}>加载中...</div>;
    if (!panels?.length) return null;

    return panels.map((panel) => (
      <div key={panel.id} className={styles.panelItem}>
        <div className={styles.panelItemHeader}>
          {data?.panels.some((item) => item.id === panel.id) ? (
            <span className={styles.addedText}>已添加</span>
          ) : (
            <Radio.Root value={panel.id} className={styles.Radio}>
              <Radio.Indicator className={styles.Indicator} />
            </Radio.Root>
          )}
          {panel.title}
        </div>
        <div style={{ flex: 1 }}>
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
    ));
  }, [data?.panels, isLoading, panels]);

  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.Backdrop} />
      <Dialog.Popup className={styles.popup}>
        <div className={styles.content}>
          <Dialog.Title className={styles.title}>选择 Panel</Dialog.Title>
          <Dialog.Description className={styles.description}>
            选择要添加到仪表板的 Panel
          </Dialog.Description>
          <RadioGroup
            aria-labelledby={id}
            onValueChange={setSelectedPanelId}
            className={styles.panelList}
          >
            {panelList}
          </RadioGroup>

          <div className={styles.scopeSection}>
            <div className={styles.scopeTitle}>添加范围</div>
            <div className={styles.scopeOptions}>
              <button
                type="button"
                className={clsx(
                  styles.scopeButton,
                  scope === "active" && styles.scopeButtonActive,
                )}
                onClick={() => setScope("active")}
              >
                仅当前断点
              </button>
              <button
                type="button"
                className={clsx(
                  styles.scopeButton,
                  scope === "configured" && styles.scopeButtonActive,
                )}
                onClick={() => setScope("configured")}
              >
                已配置断点
              </button>
              <button
                type="button"
                className={clsx(
                  styles.scopeButton,
                  scope === "all" && styles.scopeButtonActive,
                )}
                onClick={() => setScope("all")}
              >
                全部断点
              </button>
            </div>
            <p className={styles.scopeHint}>
              当前正在编辑 {getBreakpointSummaryLabel(state.activeBreakpoint)}。
              “仅当前断点”不会再默认回填全部预设断点。
            </p>
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
