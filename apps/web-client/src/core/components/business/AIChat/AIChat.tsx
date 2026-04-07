import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { Bubble, ThoughtChain, Actions } from "@ant-design/x";
import styles from "./AIChat.module.scss";
import "./variables.css";
import { useChatState } from "./hooks/useChatState.hook";
import { useSSEHandler } from "./hooks/useSSEHandler.hook";
import { useMessageActions } from "./hooks/useMessageActions.hook";
import {
  TextMessage,
  InterruptMessage,
  ToolCallMessage,
  ToolResultMessage,
  ErrorMessage,
  Header,
  EnhancedSender,
} from "./components";
import { createUserMessage } from "./utils/messageAdapter.utils";
import type { AIChatProps, ChatMessage, YieldType } from "./types";
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
  ): ThoughtChainItem | null => {
    switch (message.type) {
      case "reasoning":
        return {
          key: message.id,
          title: index < messages.length - 1 ? "思考完成" : "思考中...",
          status: index < messages.length - 1 ? "success" : "loading",
          content: typeof message.content === "string" ? message.content : "",
        };
      case "tool_call":
        return {
          key: message.id,
          title: `调用工具: ${message.meta?.tool_call?.name || "未知工具"}`,
          status: index < messages.length - 1 ? "success" : "loading",
          content: (
            <ToolCallMessage
              meta={{ name: message.meta?.tool_call?.name || "" }}
            />
          ),
        };
      case "tool_result":
        return {
          key: message.id,
          title: "工具执行结果",
          status: "success",
          content: (
            <ToolResultMessage
              content={
                typeof message.content === "string" ? message.content : ""
              }
            />
          ),
        };
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
    const thoughtChainItems = group
      .map(renderThoughtChainItem)
      .filter((item): item is ThoughtChainItem => item !== null);

    const textMessage = group.find((msg: ChatMessage) => msg.type === "text");
    const interruptMessage = group.find(
      (msg: ChatMessage) => msg.type === "interrupt",
    );

    return (
      <div key={groupIndex} className={styles["assistant-group"]}>
        <div className={styles["assistant-content"]}>
          {thoughtChainItems.length > 0 && (
            <div className={styles["thought-chain"]}>
              <ThoughtChain items={thoughtChainItems} />
            </div>
          )}

          {textMessage && (
            <div className={styles["message-item"]}>
              <TextMessage message={textMessage} />
            </div>
          )}

          {interruptMessage && (
            <InterruptMessage content={interruptMessage.content} />
          )}

          {textMessage && (
            <Actions
              items={getMessageActions(
                typeof textMessage.content === "string"
                  ? textMessage.content
                  : "",
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
