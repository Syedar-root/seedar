import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bubble,
  ThoughtChain,
  Actions,
  ThoughtChainItemType,
} from "@ant-design/x";
import styles from "./AIChat.module.scss";
import "./variables.css";
import { useChatState } from "./hooks/useChatState.hook";
import { useSSEHandler } from "./hooks/useSSEHandler.hook";
import { useMessageActions } from "./hooks/useMessageActions.hook";
import {
  TextMessage,
  InterruptMessage,
  ToolCallMessage,
  ErrorMessage,
  Header,
  EnhancedSender,
} from "./components";
import { createUserMessage } from "./utils/messageAdapter.utils";
import type { AIChatProps, ChatMessage, YieldType } from "./types";
import type { ToolCallMessageProps } from "./components";
import clsx from "clsx";

type AssistantMessageGroup = ChatMessage[];

interface ThoughtChainItem {
  key: string;
  title: string;
  status: "success" | "loading" | "error";
  content: React.ReactNode;
}

const AIChat: React.FC<AIChatProps> = ({
  messages = [],
  loading = false,
  onSendMessage,
  sseData,
  placeholder = "请输入消息...",
  disabled = false,
  commands,
  onCommandSelect,
  models,
  currentModel,
  onModelChange,
  title,
  onAddChat,
  onShowHistory,
  className,
  style,
}) => {
  const { getMessageActions } = useMessageActions();
  const messagesListRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    if (!messagesListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesListRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      onSendMessage?.(content);
    },
    [onSendMessage],
  );

  const renderContent = useCallback(
    (_: unknown, info: { key?: string | number }): React.ReactNode => {
      const msg = messages.find((m) => m.id === info.key);
      if (!msg) return "";
      return <TextMessage message={msg} />;
    },
    [messages],
  );

  const renderActions = useCallback(
    (_: unknown, info: { key?: string | number }): React.ReactNode => {
      const msg = messages.find((m) => m.id === info.key);
      if (!msg || msg.role === "user") return null;
      const content = typeof msg.content === "string" ? msg.content : "";
      const actions = getMessageActions(content);
      return <Actions items={actions} />;
    },
    [getMessageActions, messages],
  );

  const { userMessages, assistantGroups } = useMemo(() => {
    const userMessages: ChatMessage[] = [];
    const assistantGroups: AssistantMessageGroup[] = [];

    let currentGroup: AssistantMessageGroup = [];

    messages.forEach((message: ChatMessage) => {
      if (message.role === "user") {
        if (currentGroup.length > 0) {
          assistantGroups.push([...currentGroup]);
          currentGroup = [];
        }
        userMessages.push(message);
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      assistantGroups.push(currentGroup);
    }

    return { userMessages, assistantGroups };
  }, [messages]);

  const renderThoughtChainItem = (
    message: ChatMessage,
    index: number,
    messages: ChatMessage[],
  ): ThoughtChainItemType | null => {
    switch (message.type) {
      case "reasoning":
        return {
          key: message.id,
          title: index < messages.length - 1 ? "思考完成" : "思考中...",
          status: index < messages.length - 1 ? "success" : "loading",
          collapsible: true,
          content: typeof message.content === "string" ? message.content : "",
        };
      case "tool_call": {
        const toolCallId = message.meta?.tool_call?.id;
        const toolResult = toolCallId
          ? messages.find(
              (m) =>
                m.type === "tool_result" &&
                m.meta?.tool_result?.tool_call_id === toolCallId,
            )
          : null;
        return {
          key: message.id,
          title: `调用工具: ${message.meta?.tool_call?.name || "未知工具"}`,
          status: index < messages.length - 1 ? "success" : "loading",
          collapsible: true,
          content: (
            <ToolCallMessage
              meta={message.meta as ToolCallMessageProps["meta"]}
              toolCallId={toolCallId}
              resultContent={
                toolResult
                  ? typeof toolResult.content === "string"
                    ? toolResult.content
                    : ""
                  : undefined
              }
            />
          ),
        };
      }
      case "error":
        return {
          key: message.id,
          title: "错误",
          status: "error",
          content: (
            <ErrorMessage
              content={
                typeof message.content === "string" ? message.content : ""
              }
            />
          ),
        };
      default:
        return null;
    }
  };

  const renderAssistantGroup = (
    group: AssistantMessageGroup,
    groupIndex: number,
  ): React.ReactNode => {
    const thoughtChainMap = new Map<string, ThoughtChainItem>();

    group.forEach((msg: ChatMessage, index: number) => {
      const chainItem = renderThoughtChainItem(msg, index, group);
      if (chainItem) {
        thoughtChainMap.set(msg.id, chainItem as ThoughtChainItem);
      }
    });

    const allExpandedKeys = Array.from(thoughtChainMap.keys());

    const renderItem = (msg: ChatMessage): React.ReactNode => {
      if (msg.type === "text") {
        return (
          <div key={msg.id} className={styles["message-item"]}>
            <TextMessage message={msg} />
          </div>
        );
      }
      if (msg.type === "interrupt") {
        return (
          <div key={msg.id} className={styles["message-item"]}>
            <InterruptMessage content={msg.content} />
          </div>
        );
      }
      if (thoughtChainMap.has(msg.id)) {
        const item = thoughtChainMap.get(msg.id)!;
        return (
          <div key={msg.id} className={styles["message-item"]}>
            <ThoughtChain
              defaultExpandedKeys={allExpandedKeys}
              items={[item]}
            />
          </div>
        );
      }
      return null;
    };

    const textOrInterruptMessages = group.filter(
      (msg: ChatMessage) => msg.type === "text" || msg.type === "interrupt",
    );

    return (
      <div key={groupIndex} className={styles["assistant-group"]}>
        <div className={styles["assistant-content"]}>
          {group.map((msg) => renderItem(msg))}

          {textOrInterruptMessages.some((msg) => msg.type === "text") && (
            <Actions
              items={getMessageActions(
                textOrInterruptMessages
                  .filter((msg) => msg.type === "text")
                  .map((msg) =>
                    typeof msg.content === "string" ? msg.content : "",
                  )
                  .join(""),
              )}
            />
          )}
        </div>
      </div>
    );
  };

  const userBubbleItems = useMemo(() => {
    return userMessages.map((message: ChatMessage) => ({
      key: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      placement: "end" as const,
      loading: !message.done,
      contentRender: renderContent,
      footer: renderActions,
    }));
  }, [userMessages, renderContent, renderActions]);

  return (
    <div
      className={clsx(styles["chat-container"], className)}
      style={style}
      role="region"
      aria-label="AI对话区域"
    >
      {(title || onAddChat || onShowHistory) && (
        <Header
          title={title}
          onAddChat={onAddChat}
          onShowHistory={onShowHistory}
        />
      )}
      <div
        className={styles["messages-list"]}
        ref={messagesListRef}
        onScroll={handleScroll}
        role="log"
        aria-label="消息列表"
        aria-live="polite"
      >
        {assistantGroups.map((group: AssistantMessageGroup, index: number) => {
          const userMessageBefore = userMessages[index];
          return (
            <React.Fragment key={index}>
              {userMessageBefore && (
                <Bubble.List
                  items={[userBubbleItems[index]]}
                  className={styles["bubble-item"]}
                />
              )}
              {renderAssistantGroup(group, index)}
            </React.Fragment>
          );
        })}
        {userMessages.length > assistantGroups.length && (
          <Bubble.List items={[userBubbleItems[userBubbleItems.length - 1]]} />
        )}
      </div>
      <div className={styles["sender-wrapper"]}>
        <EnhancedSender
          loading={loading}
          onSubmit={handleSend}
          placeholder={placeholder}
          disabled={disabled}
          commands={commands}
          onCommandSelect={onCommandSelect}
          models={models}
          currentModel={currentModel}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
};

export default AIChat;
