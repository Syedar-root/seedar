import type {
  ChatMessage,
  ToolCallMeta,
  ToolResultMeta,
  AskQuestionItem,
} from "../../types";

export interface TextMessageProps {
  message: ChatMessage;
}

export interface ToolCallMessageProps {
  meta?: ToolCallMeta;
}

export interface ToolResultMessageProps {
  content: string;
  meta?: ToolResultMeta;
}

export interface InterruptMessageProps {
  content: string | AskQuestionItem[];
  onSubmit?: (data: Record<string, unknown>) => void;
}

export interface ErrorMessageProps {
  content: string;
}
