import React, { useCallback, useMemo } from "react";
import { useSeedarDashboardContext } from "../../seedarDashboardContext";
import { usePanels } from "../../../../../hooks";
import { Dialog } from "@base-ui/react/dialog";
import styles from "./defaultAddPanelDialog.module.css";
import { SeedarPanel } from "../../seedarPanel";
import { Radio, RadioGroup } from "@base-ui/react";
import clsx from "clsx";
import { DEFAULT_W, DEFAULT_H } from "../../const";

interface DefaultAddPanelDialogProps {
  onClose: () => void;
}

export const DefaultAddPanelDialog: React.FC<DefaultAddPanelDialogProps> = ({
  onClose,
}) => {
  const { actions, state } = useSeedarDashboardContext();
  const { data: panels, isLoading } = usePanels();
  const [selectedPanelId, setSelectedPanelId] = React.useState<string>("");

  const handlePanelSelect = useCallback(() => {
    if (!selectedPanelId) return;
    actions.addPanel(selectedPanelId, { w: DEFAULT_W, h: DEFAULT_H });
    onClose();
  }, [actions, selectedPanelId, onClose]);

  const id = React.useId();

  const panelList = useMemo(() => {
    if (isLoading) return <div className={styles.loading}>加载中...</div>;
    if (!panels?.length) return null;

    return panels.map((panel) => (
      <div key={panel.id} className={styles.panelItem}>
        <div className={styles.panelItemHeader}>
          {state.localLayout?.lg?.some((item) => item.i === panel.id) ? (
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
  }, [isLoading, panels, state.localLayout]);

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
