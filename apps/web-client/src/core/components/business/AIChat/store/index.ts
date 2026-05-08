import { useState, useCallback } from "react";
import type {
  ChatMessage,
  ChatStoreState,
  ChatStoreActions,
  MessageUpdate,
  AiSessionState,
  SessionActions,
} from "../types";

export const useChatStore = (initialMessages: ChatMessage[] = []) => {
  const [state, setState] = useState<ChatStoreState>({
    messages: initialMessages,
    isLoading: false,
    inputValue: "",
  });

  const setMessages = useCallback((messages: ChatMessage[]) => {
    setState((prev) => ({ ...prev, messages }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const updateMessage = useCallback((id: string, updates: MessageUpdate) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id
          ? typeof updates === "function"
            ? updates(msg)
            : { ...msg, ...updates }
          : msg,
      ),
    }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setInputValue = useCallback((inputValue: string) => {
    setState((prev) => ({ ...prev, inputValue }));
  }, []);

  const actions: ChatStoreActions = {
    setMessages,
    addMessage,
    updateMessage,
    setIsLoading,
    setInputValue,
  };

  return { state, actions };
};

export const useSessionStore = (initialSessionId: string | null = null) => {
  const [sessionState, setSessionState] = useState<AiSessionState>({
    currentSessionId: initialSessionId,
    isStreaming: false,
    error: null,
    currentModel: "gpt-4",
  });

  const setCurrentSessionId = useCallback((sessionId: string | null) => {
    setSessionState((prev) => ({ ...prev, currentSessionId: sessionId }));
  }, []);

  const setIsStreaming = useCallback((isStreaming: boolean) => {
    setSessionState((prev) => ({ ...prev, isStreaming }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setSessionState((prev) => ({ ...prev, error }));
  }, []);

  const setCurrentModel = useCallback((model: string) => {
    setSessionState((prev) => ({ ...prev, currentModel: model }));
  }, []);

  const sessionActions: SessionActions = {
    setCurrentSessionId,
    setIsStreaming,
    setError,
    setCurrentModel,
  };

  return { sessionState, sessionActions };
};
