import React from 'react';
import { useSeedarDashboardContext } from '../../seedarDashboardContext';
import { usePanels } from '../../../../../hooks';
import { Dialog } from '@base-ui/react/dialog';
import styles from './defaultAddPanelDialog.module.css';
import { SeedarPanel } from '../../seedarPanel';
import { Radio, RadioGroup } from '@base-ui/react';
import clsx from 'clsx';

interface DefaultAddPanelDialogProps {
  onClose: () => void;
}

export const DefaultAddPanelDialog: React.FC<DefaultAddPanelDialogProps> = ({
  onClose,
}) => {
  const { actions, state } = useSeedarDashboardContext();
  const { data: panels, isLoading } = usePanels();
  const [selectedPanelId, setSelectedPanelId] = React.useState<string>(
    panels?.[0]?.id || ''
  );

  const handlePanelSelect = () => {
    actions.addPanel(selectedPanelId);
    onClose();
  };

  const id = React.useId();

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
            defaultValue={panels?.[0]?.id || ''}
            onValueChange={setSelectedPanelId}
            className={styles.panelList}
          >
            {isLoading ? (
              <div className={styles.loading}>加载中...</div>
            ) : (
              panels?.map((panel) => (
                <div
                  key={panel.id}
                  // onClick={() => handlePanelSelect(panel.id)}
                  className={styles.panelItem}
                >
                  <div
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <Radio.Root value={panel.id} className={styles.Radio}>
                      <Radio.Indicator className={styles.Indicator} />
                    </Radio.Root>
                    {panel.title}
                  </div>
                  <div style={{ flex: 1 }}>
                    <SeedarPanel
                      style={{
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                      }}
                      showTitle={false}
                      panelId={panel.id}
                    />
                  </div>
                </div>
              ))
            )}
          </RadioGroup>

          <div className={styles.actions}>
            <button
              onClick={handlePanelSelect}
              className={clsx(styles.actionsButton, styles.addButton)}
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
