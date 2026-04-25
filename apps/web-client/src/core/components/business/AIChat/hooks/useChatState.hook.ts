import { useMemo } from 'react';
import { useChatStore } from '../store';
import type { ChatMessage } from '../types';
import { adaptMessageToBubble } from '../utils/messageAdapter.utils';

export const useChatState = (initialMessages: ChatMessage[] = []) => {
  const { state, actions } = useChatStore(initialMessages);

  const bubbleItems = useMemo(() => {
    return state.messages.map(adaptMessageToBubble);
  }, [state.messages]);

  return {
    messages: state.messages,
    bubbleItems,
    isLoading: state.isLoading,
    inputValue: state.inputValue,
    ...actions,
  };
};
