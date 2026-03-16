import React from 'react';
import { useSeedarDashboardContext } from './seedarDashboardContext';
import { DefaultAddPanelDialog } from './components/defaultAddPanelDialog';
import { Dialog } from '@base-ui/react/dialog';

export { DefaultAddPanelDialog };

interface TriggersProps {
  children: React.ReactNode;
}

export const Triggers: React.FC<TriggersProps> = ({ children }) => {
  return <div className="seedar-dashboard-triggers">{children}</div>;
};

interface SaveTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

interface SaveTriggerProps {
  children?:
    | React.ReactNode
    | ((props: SaveTriggerRenderProps) => React.ReactNode);
}

export const SaveTrigger: React.FC<SaveTriggerProps> = ({ children }) => {
  const { actions, state } = useSeedarDashboardContext();

  const handleClick = () => {
    if (!state.isSavingLayout && state.hasUnsavedChanges) {
      actions.saveLayout();
    }
  };

  const renderProps: SaveTriggerRenderProps = {
    onClick: handleClick,
    disabled: !state.hasUnsavedChanges || state.isSavingLayout,
    isSaving: state.isSavingLayout,
    hasUnsavedChanges: state.hasUnsavedChanges,
  };

  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '保存布局'}
    </button>
  );
};

interface CancelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  hasUnsavedChanges: boolean;
}

interface CancelTriggerProps {
  children?:
    | React.ReactNode
    | ((props: CancelTriggerRenderProps) => React.ReactNode);
}

export const CancelTrigger: React.FC<CancelTriggerProps> = ({ children }) => {
  const { actions, state } = useSeedarDashboardContext();

  const handleClick = () => {
    if (state.hasUnsavedChanges) {
      actions.cancelChanges();
    }
  };

  const renderProps: CancelTriggerRenderProps = {
    onClick: handleClick,
    disabled: !state.hasUnsavedChanges,
    hasUnsavedChanges: state.hasUnsavedChanges,
  };

  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '取消'}
    </button>
  );
};

interface RemovePanelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isRemoving: boolean;
}

interface RemovePanelTriggerProps {
  panelId: string;
  children?:
    | React.ReactNode
    | ((props: RemovePanelTriggerRenderProps) => React.ReactNode);
}

export const RemovePanelTrigger: React.FC<RemovePanelTriggerProps> = ({
  panelId,
  children,
}) => {
  const { actions, state } = useSeedarDashboardContext();

  const handleClick = () => {
    if (!state.isRemovingPanel) {
      actions.removePanel(panelId);
    }
  };

  const renderProps: RemovePanelTriggerRenderProps = {
    onClick: handleClick,
    disabled: state.isRemovingPanel,
    isRemoving: state.isRemovingPanel,
  };

  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '移除 Panel'}
    </button>
  );
};

interface AddPanelTriggerRenderProps {
  onClick: () => void;
}

interface AddPanelTriggerProps {
  children?:
    | React.ReactNode
    | ((props: AddPanelTriggerRenderProps) => React.ReactNode);
  panelsDialog?: (props: { onClose: () => void }) => React.ReactNode;
}

export const AddPanelTrigger: React.FC<AddPanelTriggerProps> = ({
  children,
  panelsDialog,
}) => {
  const { actions, state } = useSeedarDashboardContext();

  const handleClick = () => {
    actions.openAddPanelDialog();
  };

  const renderProps: AddPanelTriggerRenderProps = {
    onClick: handleClick,
  };

  return (
    <>
      {typeof children === 'function' ? (
        children(renderProps)
      ) : (
        <button onClick={handleClick}>{children || '添加 Panel'}</button>
      )}
      <Dialog.Root
        open={state.isAddPanelDialogOpen}
        onOpenChange={(open) => !open && actions.closeAddPanelDialog()}
      >
        {panelsDialog ? (
          panelsDialog({ onClose: actions.closeAddPanelDialog })
        ) : (
          <DefaultAddPanelDialog onClose={actions.closeAddPanelDialog} />
        )}
      </Dialog.Root>
    </>
  );
};
