import type { ChatMessage, MessageType } from "../types";
import type { AiStreamChunk } from "#pkg/seedar/types";

export const adaptMessageToBubble = (message: ChatMessage) => {
  return {
    key: message.id,
    content: message.content,
    role: message.role === "act" ? "assistant" : message.role,
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
    type: "text",
    content,
    role: "user",
    timestamp: Date.now(),
    done: true,
  };
};

export const createAssistantMessage = (
  content: string = "",
  type: MessageType = "text",
): ChatMessage => {
  return {
    id: generateMessageId(),
    type,
    content,
    role: "assistant",
    timestamp: Date.now(),
    done: false,
  };
};

export const adaptAiStreamChunkToChatMessage = (
  chunk: AiStreamChunk,
  existingMessageId?: string,
): ChatMessage => {
  const type: MessageType = (chunk.type as MessageType) || "text";

  return {
    id: existingMessageId || generateMessageId(),
    type,
    content: chunk.content,
    role: (chunk.role as "user" | "assistant" | "act") || "assistant",
    timestamp: Date.now(),
    done: chunk.done,
    meta: chunk.meta
      ? {
          tool_call: chunk.meta.tool_call,
          tool_result: chunk.meta.tool_result,
        }
      : undefined,
  };
};

export const updateChatMessageWithChunk = (
  message: ChatMessage,
  chunk: AiStreamChunk,
): ChatMessage => {
  const content =
    typeof message.content === "string" && typeof chunk.content === "string"
      ? message.content + chunk.content
      : chunk.content;

  return {
    ...message,
    content,
    done: chunk.done,
    meta: chunk.meta
      ? {
          tool_call: chunk.meta.tool_call,
          tool_result: chunk.meta.tool_result,
        }
      : message.meta,
  };
};
