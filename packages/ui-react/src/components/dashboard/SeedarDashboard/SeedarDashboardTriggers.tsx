import React from "react";
import { Dialog } from "@base-ui/react/dialog";

import { DefaultAddPanelDialog } from "./components/DefaultAddPanelDialog";
import {
  useAddPanelTriggerRenderProps,
  useCancelTriggerRenderProps,
  useRemovePanelTriggerRenderProps,
  useSaveTriggerRenderProps,
} from "./hooks/useSeedarDashboardTriggerRenderProps.hook";
import type {
  AddPanelTriggerProps,
  CancelTriggerProps,
  RemovePanelTriggerProps,
  SaveTriggerProps,
  TriggersProps,
} from "./SeedarDashboardTriggers.types";
import {
  DEFAULT_ADD_PANEL_TRIGGER_LABEL,
  DEFAULT_CANCEL_TRIGGER_LABEL,
  DEFAULT_REMOVE_PANEL_TRIGGER_LABEL,
  DEFAULT_SAVE_TRIGGER_LABEL,
} from "./utils/getSeedarDashboardTriggerLabel";

export { DefaultAddPanelDialog };

export const Triggers: React.FC<TriggersProps> = ({ children }) => {
  return <div className="seedar-dashboard-triggers">{children}</div>;
};

export const SaveTrigger: React.FC<SaveTriggerProps> = ({ children }) => {
  const renderProps = useSaveTriggerRenderProps();

  if (!renderProps) {
    return null;
  }

  if (typeof children === "function") {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>
      {children || DEFAULT_SAVE_TRIGGER_LABEL}
    </button>
  );
};

export const CancelTrigger: React.FC<CancelTriggerProps> = ({ children }) => {
  const renderProps = useCancelTriggerRenderProps();

  if (!renderProps) {
    return null;
  }

  if (typeof children === "function") {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>
      {children || DEFAULT_CANCEL_TRIGGER_LABEL}
    </button>
  );
};

export const RemovePanelTrigger: React.FC<RemovePanelTriggerProps> = ({
  panelId,
  children,
}) => {
  const renderProps = useRemovePanelTriggerRenderProps(panelId);

  if (!renderProps) {
    return null;
  }

  if (typeof children === "function") {
    return <>{children(renderProps)}</>;
  }

  return (
    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>
      {children || DEFAULT_REMOVE_PANEL_TRIGGER_LABEL}
    </button>
  );
};

export const AddPanelTrigger: React.FC<AddPanelTriggerProps> = ({
  children,
  panelsDialog,
}) => {
  const renderProps = useAddPanelTriggerRenderProps();

  if (!renderProps) {
    return null;
  }

  return (
    <>
      {typeof children === "function" ? (
        children({ onClick: renderProps.onClick })
      ) : (
        <div onClick={renderProps.onClick}>
          {children || DEFAULT_ADD_PANEL_TRIGGER_LABEL}
        </div>
      )}
      <Dialog.Root
        open={renderProps.isDialogOpen}
        onOpenChange={(open) => !open && renderProps.onClose()}
      >
        {panelsDialog ? (
          panelsDialog({ onClose: renderProps.onClose })
        ) : (
          <DefaultAddPanelDialog onClose={renderProps.onClose} />
        )}
      </Dialog.Root>
    </>
  );
};
