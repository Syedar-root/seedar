import type { AiResponse } from "#pkg/seedar/types";

export interface ModelConfigDialogProps {
  open: boolean;
  models: AiResponse[];
  currentModelId?: string;
  onClose: () => void;
  onCurrentModelChange?: (modelId: string) => void;
  onCreated?: (model: AiResponse) => void;
  onUpdated?: (model: AiResponse) => void;
  onDeleted?: (modelId: string) => void;
}
