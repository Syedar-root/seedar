import type React from "react";
import type {
  AiAgentStreamChunk,
  AiChatResumeDto,
  AiInterruptPayload,
  AiStreamChunk,
  InterruptContent,
  AskQuestionParams as _AskQuestionParams,
} from "#pkg/seedar/types";

export type YieldType =
  | "interrupt"
  | "tool_call"
  | "tool_result"
  | "text"
  | "reasoning"
  | "error";
export type MessageType = YieldType;

export interface ChoiceOptionItem {
  label: string;
  value: string;
  description?: string;
  isOther?: boolean;
}

export interface AskQuestionItem {
  id: string;
  question: string;
  type: "text" | "confirm" | "choice";
  options?: ChoiceOptionItem[];
  multiple?: boolean;
  canSkip?: boolean;
}

export interface AskQuestionParams {
  questions: AskQuestionItem[];
  answers?: InterruptAnswer[];
}

export interface ChoiceOption {
  label: string;
  value: string;
  isOther: boolean;
}

export interface InterruptAnswer {
  questionId: string;
  question?: string;
  answer?: string | string[];
}

export interface InterruptSubmitData {
  answers: InterruptAnswer[];
}

export interface ToolCallMeta {
  tool_call?: {
    id: string;
    name: string;
  };
  [key: string]: any;
}

export interface ToolResultMeta {
  tool_result?: {
    tool_call_id: string;
  };
  [key: string]: any;
}

export interface SSEData {
  type: MessageType;
  data: {
    content: string | InterruptContent<AiInterruptPayload>;
    type?: MessageType;
    done: boolean;
    role: "user" | "clarify" | "act";
    sessionId: string;
    meta?: ToolCallMeta | ToolResultMeta;
  };
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string | InterruptContent<AiInterruptPayload>;
  displayContent?: string;
  role: "user" | "clarify" | "act";
  timestamp: number;
  done: boolean;
  meta?: ToolCallMeta | ToolResultMeta;
}

export interface CommandItem {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ModelItem {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface AIChatProps {
  messages?: ChatMessage[];
  loading?: boolean;
  onSendMessage?: (
    content: string,
    isResume?: boolean,
    resumePayload?: AiChatResumeDto,
  ) => void;
  sseData?: SSEData;
  placeholder?: string;
  disabled?: boolean;
  commands?: CommandItem[];
  onCommandSelect?: (command: CommandItem) => void;
  models?: ModelItem[];
  currentModel?: string;
  onModelChange?: (modelKey: string) => void;
  title?: React.ReactNode;
  onAddChat?: () => void;
  onShowHistory?: () => void;
  aiId?: string;
  initialSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ChatStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  inputValue: string;
}

export type MessageUpdate =
  | Partial<ChatMessage>
  | ((prev: ChatMessage) => ChatMessage);

export interface ChatStoreActions {
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: MessageUpdate) => void;
  setIsLoading: (loading: boolean) => void;
  setInputValue: (value: string) => void;
}

export interface OnSendMessageCallback {
  (content: string): void;
}

export interface OnInterruptSubmitCallback {
  (messageId: string, data: Record<string, unknown>): void;
}

export interface InterruptMessageProps {
  content: string | InterruptContent<AiInterruptPayload>;
  onSubmit?: (
    data: string,
    isResume: boolean,
    resumePayload?: AiChatResumeDto,
  ) => void;
  disabled?: boolean;
}

export interface AiSessionState {
  currentSessionId: string | null;
  isStreaming: boolean;
  error: string | null;
  currentModel: string;
}

export interface AiChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  inputValue: string;
}

export interface SessionActions {
  setCurrentSessionId: (sessionId: string | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentModel: (model: string) => void;
}

export interface AiStreamChunkAdapter {
  (chunk: AiAgentStreamChunk): ChatMessage;
}
