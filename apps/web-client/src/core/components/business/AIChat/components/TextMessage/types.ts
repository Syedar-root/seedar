import type {
  ChatMessage,
  ToolCallMeta,
  ToolResultMeta,
} from "../../types";
import type {
  InterruptContent,
  AskQuestionParams,
} from "#pkg/seedar/types";

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
  content: string | InterruptContent<AskQuestionParams>;
  onSubmit?: (data: Record<string, unknown>) => void;
}

export interface ErrorMessageProps {
  content: string;
}
