import type { CommandItem, ModelItem } from "../../types";

export interface EnhancedSenderProps {
  loading?: boolean;
  onSubmit?: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  commands?: CommandItem[];
  onCommandSelect?: (command: CommandItem) => void;
  models?: ModelItem[];
  currentModel?: string;
  onModelChange?: (modelKey: string) => void;
}

export interface CommandSuggestionItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}
