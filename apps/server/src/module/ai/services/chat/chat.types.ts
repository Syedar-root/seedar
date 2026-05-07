import type { BaseMessage } from '@langchain/core/messages';

export type ContextPolicy = {
  contextWindowTokens?: number;
  softRatio?: number;
  hardRatio?: number;
  keepRecentSegments?: number;
};

export type ResolvedContextPolicy = {
  contextWindowTokens: number;
  softRatio: number;
  hardRatio: number;
  keepRecentSegments: number;
};

export type MessageSegment = {
  sid: string;
  messages: BaseMessage[];
};

export type ContextManagementEvent = {
  sessionId: string;
  phase: 'start' | 'success' | 'fallback' | 'failed';
  strategy: 'preventive' | 'window' | 'summary' | 'trim';
  beforeTokens: number;
  afterTokens?: number;
  summarySegments?: number;
  message: string;
};

export type ContextManagementResult = {
  managedMessages?: BaseMessage[];
  events: ContextManagementEvent[];
};
