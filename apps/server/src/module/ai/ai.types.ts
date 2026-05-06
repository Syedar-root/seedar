import type {
  AiChatScene,
  AiChatMode,
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptResultPayload,
} from '@seedar/types/ai';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LLMConfig {
  type: 'openai' | 'anthropic' | 'qwen' | 'local' | 'deepseek';
  modelKwargs?: Record<string, any>;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StreamingResult {
  sessionId: string;
  timestamp: Date;
}

export interface ToolConfig {
  name: string;
  description: string;
  schema?: any;
}

export type YieldType =
  | 'interrupt'
  | 'tool_call'
  | 'tool_result'
  | 'text'
  | 'reasoning'
  | 'error';

export type InterruptContent<T> = {
  id: string;
  value: T;
};

export type StreamChunkContent<T> = string | InterruptContent<T>;

export interface StreamChunk<T> {
  sid: string;
  content: StreamChunkContent<T>;
  type?: YieldType;
  done: boolean;
  role?: string;
  meta?: {
    tool_call?: { id: string; name: string; [key: string]: any };
    tool_result?: { tool_call_id: string };
  };
}

export type AiAgentStreamChunk = StreamChunk<AiInterruptPayload>;

export interface AiContextStreamChunk {
  type: 'context';
  data: {
    sessionId: string;
    phase: 'start' | 'success' | 'fallback' | 'failed';
    strategy: 'preventive' | 'window' | 'summary' | 'trim';
    beforeTokens: number;
    afterTokens?: number;
    summarySegments?: number;
    message: string;
  };
  done: false;
}

export type AiStreamOutputChunk = AiAgentStreamChunk | AiContextStreamChunk;

export type {
  AiChatScene,
  AiChatMode,
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptResultPayload,
} from '@seedar/types/ai';
