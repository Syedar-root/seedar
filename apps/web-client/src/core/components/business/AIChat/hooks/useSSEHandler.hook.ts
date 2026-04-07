import { useEffect, useRef, useCallback } from 'react';
import type { SSEData, ChatMessage, ToolCallMeta, ToolResultMeta } from '../types';
import { generateMessageId } from '../utils/messageAdapter.utils';

interface UseSSEHandlerOptions {
  onNewMessage?: (message: ChatMessage) => void;
  onUpdateMessage?: (id: string, updates: Partial<ChatMessage> | ((prev: ChatMessage) => ChatMessage)) => void;
}

export const useSSEHandler = (options: UseSSEHandlerOptions = {}) => {
  const currentMessageIdRef = useRef<string | null>(null);
  const { onNewMessage, onUpdateMessage } = options;

  const handleSSEData = useCallback((sseData: SSEData) => {
    const { data } = sseData;

    if (!currentMessageIdRef.current || data.type !== 'text' || data.done) {
      const meta: ToolCallMeta | ToolResultMeta | undefined = data.meta;
      const newMessage: ChatMessage = {
        id: generateMessageId(),
        type: data.type ?? 'text',
        content: typeof data.content === 'string' ? data.content : '',
        role: data.role === 'act' ? 'assistant' : data.role,
        timestamp: Date.now(),
        done: data.done,
        meta,
      };
      currentMessageIdRef.current = newMessage.id;
      onNewMessage?.(newMessage);
    } else {
      onUpdateMessage?.(currentMessageIdRef.current, (prev) => ({
        ...prev,
        content: prev.content + (typeof data.content === 'string' ? data.content : ''),
        done: data.done,
      }));
    }

    if (data.done) {
      currentMessageIdRef.current = null;
    }
  }, [onNewMessage, onUpdateMessage]);

  useEffect(() => {
    return () => {
      currentMessageIdRef.current = null;
    };
  }, []);

  return { handleSSEData };
};