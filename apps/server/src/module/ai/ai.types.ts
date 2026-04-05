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
