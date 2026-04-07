import { useState, useCallback } from 'react';
import type { ChatMessage, ChatStoreState, ChatStoreActions, MessageUpdate } from '../types';

export const useChatStore = (initialMessages: ChatMessage[] = []) => {
  const [state, setState] = useState<ChatStoreState>({
    messages: initialMessages,
    isLoading: false,
    inputValue: '',
  });

  const setMessages = useCallback((messages: ChatMessage[]) => {
    setState(prev => ({ ...prev, messages }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const updateMessage = useCallback((id: string, updates: MessageUpdate) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === id
          ? typeof updates === 'function'
            ? updates(msg)
            : { ...msg, ...updates }
          : msg
      ),
    }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setInputValue = useCallback((inputValue: string) => {
    setState(prev => ({ ...prev, inputValue }));
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