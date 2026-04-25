import type { AddPanelScope } from "../../../../../utils/dashboard-layout/constants";

export interface DefaultAddPanelDialogProps {
  onClose: () => void;
}

export interface ScopeOption {
  value: AddPanelScope;
  label: string;
}
