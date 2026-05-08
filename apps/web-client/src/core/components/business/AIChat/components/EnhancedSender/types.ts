import type {
  ChatModeItem,
  CommandItem,
  ModelItem,
} from "../../types";
import type { AiChatMode } from "#pkg/seedar/types";

export interface EnhancedSenderProps {
  loading?: boolean;
  onSubmit?: (content: string, isResume?: boolean) => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  commands?: CommandItem[];
  onCommandSelect?: (command: CommandItem) => void;
  models?: ModelItem[];
  currentModel?: string;
  onModelChange?: (modelKey: string) => void;
  onManageModels?: () => void;
  modes?: ChatModeItem[];
  currentMode?: AiChatMode;
  onModeChange?: (mode: AiChatMode) => void;
}

export interface CommandSuggestionItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}
