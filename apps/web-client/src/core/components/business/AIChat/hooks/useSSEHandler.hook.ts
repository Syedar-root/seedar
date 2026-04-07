import { useEffect, useRef, useCallback } from "react";
import type {
  SSEData,
  ChatMessage,
  ToolCallMeta,
  ToolResultMeta,
} from "../types";
import { generateMessageId } from "../utils/messageAdapter.utils";

interface UseSSEHandlerOptions {
  onNewMessage?: (message: ChatMessage) => void;
  onUpdateMessage?: (
    id: string,
    updates: Partial<ChatMessage> | ((prev: ChatMessage) => ChatMessage),
  ) => void;
}

interface CurrentMessageInfo {
  id: string;
  type: string;
  toolCallId?: string;
  toolResultId?: string;
}

export const useSSEHandler = (options: UseSSEHandlerOptions = {}) => {
  const currentMessageRef = useRef<CurrentMessageInfo | null>(null);
  const { onNewMessage, onUpdateMessage } = options;

  const getToolCallId = (data: SSEData["data"]): string | undefined => {
    return (data.meta as ToolCallMeta)?.tool_call?.id;
  };

  const getToolResultId = (data: SSEData["data"]): string | undefined => {
    return (data.meta as ToolResultMeta)?.tool_result?.tool_call_id;
  };

  const isSameMessage = (
    currentInfo: CurrentMessageInfo | null,
    data: SSEData["data"],
  ): boolean => {
    if (!currentInfo) return false;

    const dataType = data.type ?? "text";
    if (currentInfo.type !== dataType) return false;

    if (dataType === "tool_call") {
      return currentInfo.toolCallId === getToolCallId(data);
    }
    if (dataType === "tool_result") {
      return currentInfo.toolResultId === getToolResultId(data);
    }

    return true;
  };

  const handleSSEData = useCallback(
    (sseData: SSEData) => {
      const { data } = sseData;
      const dataType = data.type ?? "text";
      const isDone = data.done;
      const isFirstChunk =
        !currentMessageRef.current ||
        !isSameMessage(currentMessageRef.current, data);

      if (isFirstChunk || isDone) {
        const meta: ToolCallMeta | ToolResultMeta | undefined = data.meta;
        const newMessage: ChatMessage = {
          id: generateMessageId(),
          type: dataType,
          content: data.content,
          role: data.role as ChatMessage["role"],
          timestamp: Date.now(),
          done: isDone,
          meta,
        };
        currentMessageRef.current = {
          id: newMessage.id,
          type: dataType,
          toolCallId: getToolCallId(data),
          toolResultId: getToolResultId(data),
        };

        onNewMessage?.(newMessage);
      } else {
        if (dataType === "tool_call" || dataType === "tool_result") {
          onUpdateMessage?.(currentMessageRef.current?.id || "", {
            content: data.content as ChatMessage["content"],
            done: isDone,
          });
        } else {
          onUpdateMessage?.(currentMessageRef.current?.id || "", (prev) => ({
            ...prev,
            content:
              typeof prev.content === "string" &&
              typeof data.content === "string"
                ? prev.content + data.content
                : (data.content as ChatMessage["content"]),
            done: isDone,
          }));
        }
      }

      if (isDone) {
        currentMessageRef.current = null;
      }
    },
    [onNewMessage, onUpdateMessage],
  );

  useEffect(() => {
    return () => {
      currentMessageRef.current = null;
    };
  }, []);

  return { handleSSEData };
};
