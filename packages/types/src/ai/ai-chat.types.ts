import type {
  AiInterruptPayload,
  AskQuestionParams,
  InterruptResultPayload,
} from './ai-interrupt.types';

export type YieldType =
  | "interrupt"
  | "tool_call"
  | "tool_result"
  | "text"
  | "reasoning"
  | "error";

export type AiContextPhase = "start" | "success" | "fallback" | "failed";

export type AiContextStrategy =
  | "preventive"
  | "window"
  | "summary"
  | "trim";

export interface AiContextStatusEvent {
  sessionId: string;
  phase: AiContextPhase;
  strategy: AiContextStrategy;
  beforeTokens: number;
  afterTokens?: number;
  summarySegments?: number;
  message: string;
}

export type InterruptContent<T> = {
  id: string;
  value: T;
};

export interface AiChatResumeDto {
  kind: 'user_message' | 'interrupt_result';
  message?: string;
  interruptResult?: InterruptResultPayload;
}

export type AiChatMode = 'chat' | 'agent';

export interface AiChatScene {
  path: string;
  [key: string]: unknown;
}

export interface AiChatRequestDto {
  aiId: string;
  message?: string;
  stream?: boolean;
  sessionId?: string;
  mode?: AiChatMode;
  scenes?: AiChatScene[];
  isResume?: boolean;
  resumePayload?: AiChatResumeDto;
}

export interface AiStreamChunk<TInterrupt = AskQuestionParams> {
  sid: string;
  content: string | InterruptContent<TInterrupt>;
  type: YieldType;
  done: boolean;
  role?: string;
  meta?: {
    tool_call?: { id: string; name: string; [key: string]: any };
    tool_result?: { tool_call_id: string };
  };
}

export type AiAgentStreamChunk = AiStreamChunk<AiInterruptPayload>;

export interface AiSseEvent<TInterrupt = AskQuestionParams> {
  type:
    | "ping"
    | "session"
    | "message"
    | "done"
    | "error"
    | "context"
    | "session_title";
  data:
    | string
    | AiStreamChunk<TInterrupt>
    | AiContextStatusEvent
    | { sessionId: string; isOver?: boolean }
    | { sessionId: string; title: string };
  sessionId?: string;
}

export type AiAgentSseEvent = AiSseEvent<AiInterruptPayload>;

export type {
  AiInterruptPayload,
  AskQuestionAnswer,
  AskQuestionItem,
  AskQuestionOption,
  AskQuestionParams,
  AskQuestionResult,
  AskUserInterrupt,
  InterruptResultPayload,
  WorkflowRunInterrupt,
} from './ai-interrupt.types';

export type {
  StartWorkflowRequest,
  WorkflowAction,
  WorkflowRunResult,
} from './ai-workflow.types';
