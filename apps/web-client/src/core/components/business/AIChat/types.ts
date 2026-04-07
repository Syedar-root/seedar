import type React from "react";

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
}

export interface ChoiceOption {
  label: string;
  value: string;
  isOther: boolean;
}

export interface InterruptAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
}

export interface InterruptSubmitData {
  answers: InterruptAnswer[];
}

export interface ToolCallMeta {
  id?: string;
  name?: string;
  tool_call?: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ToolResultMeta {
  id?: string;
  name?: string;
  tool_call_id?: string;
  tool_result?: {
    tool_call_id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SSEData {
  type: MessageType;
  data: {
    content: string | AskQuestionItem[];
    type?: MessageType;
    done: boolean;
    role: "user" | "act" | "assistant";
    sessionId: string;
    meta?: ToolCallMeta | ToolResultMeta;
  };
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string | AskQuestionItem[];
  role: "user" | "assistant" | "act";
  timestamp: number;
  done: boolean;
  meta?: ToolCallMeta | ToolResultMeta | Record<string, unknown>;
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
  onSendMessage?: (content: string) => void;
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
  content: string | AskQuestionItem[];
  onSubmit?: (data: InterruptSubmitData) => void;
}
