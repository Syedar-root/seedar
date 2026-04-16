import type { ReactNode } from "react";

export interface TriggersProps {
  children: ReactNode;
}

export interface SaveTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export interface SaveTriggerProps {
  children?: ReactNode | ((props: SaveTriggerRenderProps) => ReactNode);
}

export interface CancelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  hasUnsavedChanges: boolean;
}

export interface CancelTriggerProps {
  children?: ReactNode | ((props: CancelTriggerRenderProps) => ReactNode);
}

export interface RemovePanelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isRemoving: boolean;
}

export interface RemovePanelTriggerProps {
  panelId: string;
  children?: ReactNode | ((props: RemovePanelTriggerRenderProps) => ReactNode);
}

export interface AddPanelTriggerRenderProps {
  onClick: () => void;
}

export interface AddPanelTriggerProps {
  children?: ReactNode | ((props: AddPanelTriggerRenderProps) => ReactNode);
  panelsDialog?: (props: { onClose: () => void }) => ReactNode;
}
