import type { ChatMessage, MessageType } from '../types';

export const adaptMessageToBubble = (message: ChatMessage) => {
  return {
    key: message.id,
    content: message.content,
    role: message.role === 'act' ? 'assistant' : message.role,
    messageType: message.type,
    meta: message.meta,
    done: message.done,
  };
};

export const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createUserMessage = (content: string): ChatMessage => {
  return {
    id: generateMessageId(),
    type: 'text',
    content,
    role: 'user',
    timestamp: Date.now(),
    done: true,
  };
};

export const createAssistantMessage = (content: string = '', type: MessageType = 'text'): ChatMessage => {
  return {
    id: generateMessageId(),
    type,
    content,
    role: 'assistant',
    timestamp: Date.now(),
    done: false,
  };
};
