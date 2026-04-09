import { AskQuestionParams } from './services/toolSchema';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LLMConfig {
  type: 'openai' | 'anthropic' | 'qwen' | 'local' | 'deepseek';
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
  schema?: any; // tool schema
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
  values: T;
};

interface InterruptAnswer {
  questionId: string;
  question?: string;
  answer?: string | string[];
}

export interface AskQuestion extends AskQuestionParams {
  answers?: InterruptAnswer[];
}

export type StreamChunkContent<T> = string | InterruptContent<T>;

export interface StreamChunk<T> {
  sid: string; // segmentId, 流式块id，一段思考、一段正文...，每个流式块都有一个唯一的id
  content: StreamChunkContent<T>;
  type?: YieldType;
  done: boolean; //表示流式是否完成
  role?: string;
  meta?: {
    tool_call?: { id: string; name: string; [key: string]: any };
    tool_result?: { tool_call_id: string };
  };
}
