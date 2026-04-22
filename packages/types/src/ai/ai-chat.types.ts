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

export type InterruptContent<T> = {
  id: string;
  value: T;
};

export interface AiChatResumeDto {
  kind: 'user_message' | 'interrupt_result';
  message?: string;
  interruptResult?: InterruptResultPayload;
}

export interface AiChatRequestDto {
  aiId: string;
  message?: string;
  stream?: boolean;
  sessionId?: string;
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
  type: "ping" | "session" | "message" | "done" | "error";
  data: string | AiStreamChunk<TInterrupt>;
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
