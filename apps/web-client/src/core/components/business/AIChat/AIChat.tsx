import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  Bubble,
  ThoughtChain,
  Actions,
  ThoughtChainItemType,
  Think,
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
    (content: string, isResume?: boolean) => {
      onSendMessage?.(content, isResume);
    },
    [onSendMessage],
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

  const messageMap = useMemo(() => {
    return new Map(messages.map((msg) => [msg.id, msg]));
  }, [messages]);

  const renderContent = useCallback(
    (_: unknown, info: { key?: string | number }): React.ReactNode => {
      const msg =
        typeof info.key === "string" ? messageMap.get(info.key) : undefined;
      if (!msg) return "";
      return <TextMessage message={msg} />;
    },
    [messageMap],
  );

  const renderActions = useCallback(
    (_: unknown, info: { key?: string | number }): React.ReactNode => {
      const msg =
        typeof info.key === "string" ? messageMap.get(info.key) : undefined;
      if (!msg || msg.role === "user") return null;
      const content = typeof msg.content === "string" ? msg.content : "";
      const actions = getMessageActions(content);
      return <Actions items={actions} />;
    },
    [getMessageActions, messageMap],
  );

  const renderAssistantGroup = useCallback(
    (group: AssistantMessageGroup, groupIndex: number): React.ReactNode => {
      const textOrInterruptMessages = group.filter(
        (msg: ChatMessage) => msg.type === "text" || msg.type === "interrupt",
      );

      // const errorMessages = group.filter(
      //   (msg: ChatMessage) => msg.type === "error",
      // );

      const isThoughtChainType = (type: string) =>
        type === "reasoning" || type === "tool_call" || type === "tool_result";

      const renderMessage = (msg: ChatMessage): React.ReactNode => {
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
              <InterruptMessage
                content={msg.content}
                onSubmit={handleSend}
                disabled={false}
              />
            </div>
          );
        }
        if (msg.type === "error") {
          return (
            <div key={msg.id} className={styles["message-item"]}>
              <ErrorMessage
                content={typeof msg.content === "string" ? msg.content : ""}
              />
            </div>
          );
        }
        return null;
      };

      const renderConsecutiveThoughtChain = (
        chainMessages: ChatMessage[],
        startIdx: number,
        nextMsgAfterChain: ChatMessage | undefined,
      ): React.ReactNode => {
        const items: ThoughtChainItemType[] = [];

        chainMessages.forEach((msg, idx) => {
          const isLastInChain = idx === chainMessages.length - 1;
          if (msg.type === "reasoning") {
            const hasFollowingChainMsg =
              !isLastInChain || nextMsgAfterChain !== undefined;
            items.push({
              key: msg.id,
              title: hasFollowingChainMsg ? "思考完成" : "思考中...",
              status: hasFollowingChainMsg ? "success" : "loading",
              collapsible: true,
              content: typeof msg.content === "string" ? msg.content : "",
            });
          } else if (msg.type === "tool_call") {
            const toolCallId = msg.meta?.tool_call?.id;
            const toolResult = toolCallId
              ? chainMessages.find(
                  (m) =>
                    m.type === "tool_result" &&
                    m.meta?.tool_result?.tool_call_id === toolCallId,
                )
              : null;
            const hasFollowingChainMsg =
              !isLastInChain || nextMsgAfterChain !== undefined;
            items.push({
              key: msg.id,
              title: `调用工具: ${msg.meta?.tool_call?.name || "未知工具"}`,
              status: toolResult
                ? "success"
                : hasFollowingChainMsg
                  ? "success"
                  : "loading",
              collapsible: true,
              content: (
                <ToolCallMessage
                  meta={msg.meta as ToolCallMessageProps["meta"]}
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
            });
          }
        });

        if (items.length === 0) return null;

        return (
          <div key={`chain-${startIdx}`} className={styles["message-item"]}>
            <Think
              title={nextMsgAfterChain ? "思考完成" : "思考中..."}
              loading={nextMsgAfterChain === undefined}
              defaultExpanded={false}
            >
              <ThoughtChain
                defaultExpandedKeys={items
                  .map((item) => item.key)
                  .filter((key): key is string => key !== undefined)}
                items={items}
              />
            </Think>
          </div>
        );
      };

      const renderAll = (): React.ReactNode => {
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < group.length) {
          const msg = group[i];
          if (isThoughtChainType(msg.type)) {
            const chainMessages: ChatMessage[] = [];
            const chainStartIdx = i;
            while (i < group.length && isThoughtChainType(group[i].type)) {
              chainMessages.push(group[i]);
              i++;
            }
            const nextMsgAfterChain = group[i];
            elements.push(
              renderConsecutiveThoughtChain(
                chainMessages,
                chainStartIdx,
                nextMsgAfterChain,
              ),
            );
          } else {
            elements.push(renderMessage(msg));
            i++;
          }
        }
        console.log("hcs elements", elements);
        return elements;
      };

      return (
        <div key={groupIndex} className={styles["assistant-group"]}>
          <div className={styles["assistant-content"]}>
            {renderAll()}
            {group[group.length - 1]?.type === "text" && !loading && (
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
            {group[group.length - 1]?.type === "interrupt" && !loading && (
              <span className={styles["interrupt-wait-answer"]}>
                SeeMind等你回答
              </span>
            )}
          </div>
        </div>
      );
    },
    [handleSend, getMessageActions, loading],
  );

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

  useEffect(() => {
    if (loading) return;
    console.log("hcs messages", messages);
  }, [loading]);

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
