import React, {
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AlertCircle } from "lucide-react";
import {
  Bubble,
  ThoughtChain,
  Actions,
  ThoughtChainItemType,
  Think,
} from "@ant-design/x";
import { Tag } from "antd";
import styles from "./AIChat.module.scss";
import "./variables.css";
import { useMessageActions } from "./hooks/useMessageActions.hook";
import {
  TextMessage,
  InterruptMessage,
  ToolCallMessage,
  ErrorMessage,
  Header,
  EnhancedSender,
} from "./components";
import {
  formatMessageForDisplay,
  resolveCommandFromMessage,
} from "./utils/command.utils";
import type { AiChatResumeDto } from "#pkg/seedar/types";
import type { AIChatProps, ChatMessage } from "./types";
import type { ToolCallMessageProps } from "./components";
import clsx from "clsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "../../ui/ScrollArea";
import { DotsJumpLoading } from "./components/DotsJumpLoading";

type AssistantMessageGroup = ChatMessage[];

type RenderDeps = {
  loading: boolean;
  commands?: AIChatProps["commands"];
  getMessageActions: (content: string) => any[];
  handleSend: (
    content: string,
    isResume?: boolean,
    resumePayload?: AiChatResumeDto,
  ) => void;
};

const HISTORY_LOAD_MORE_LABEL = "加载更早消息";

const splitMessageGroups = (messages: ChatMessage[]) => {
  const userMessages: ChatMessage[] = [];
  const assistantGroups: AssistantMessageGroup[] = [];
  let currentGroup: AssistantMessageGroup = [];

  messages.forEach((message) => {
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
};

const renderAssistantGroup = (
  group: AssistantMessageGroup,
  groupIndex: number,
  deps: RenderDeps,
): React.ReactNode => {
  const { loading, getMessageActions, handleSend } = deps;
  const textOrInterruptMessages = group.filter(
    (msg) => msg.type === "text" || msg.type === "interrupt",
  );

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
            message={msg}
            onSubmit={handleSend}
            disabled={loading || group[group.length - 1]?.id !== msg.id}
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
        return;
      }

      if (msg.type === "tool_call") {
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

    if (items.length === 0) {
      return null;
    }

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
          i += 1;
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
        i += 1;
      }
    }

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
      </div>
    </div>
  );
};

interface ConversationRow {
  key: string;
  userMessage?: ChatMessage;
  assistantGroup?: AssistantMessageGroup;
}

const buildConversationRows = (messages: ChatMessage[]): ConversationRow[] => {
  const { userMessages, assistantGroups } = splitMessageGroups(messages);
  const rowCount = Math.max(userMessages.length, assistantGroups.length);
  const rows: ConversationRow[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const userMessage = userMessages[index];
    const assistantGroup = assistantGroups[index];

    if (assistantGroup) {
      rows.push({
        key: `${assistantGroup[0]?.id || "assistant-group"}-${index}`,
        userMessage,
        assistantGroup,
      });
      continue;
    }

    if (userMessage) {
      rows.push({
        key: `${userMessage.id}-${index}`,
        userMessage,
      });
    }
  }

  return rows;
};

const MessageRow = React.memo(
  ({
    row,
    rowIndex,
    deps,
  }: {
    row: ConversationRow;
    rowIndex: number;
    deps: RenderDeps;
  }) => {
    const userBubbleItems = useMemo(() => {
      if (!row.userMessage) {
        return [];
      }

      const command =
        typeof row.userMessage.content === "string"
          ? resolveCommandFromMessage(row.userMessage.content, deps.commands)
          : undefined;

      return [
        {
          key: row.userMessage.id,
          role: row.userMessage.role as "user" | "assistant",
          content: command ? (
            <Tag variant="filled" color="blue">
              {command.label}
            </Tag>
          ) : typeof row.userMessage.content === "string" ? (
            row.userMessage.displayContent ||
            formatMessageForDisplay(row.userMessage.content, deps.commands)
          ) : (
            row.userMessage.content
          ),
          placement: "end" as const,
          loading: !row.userMessage.done,
        },
      ];
    }, [deps.commands, row.userMessage]);

    return (
      <>
        {row.userMessage && (
          <Bubble.List items={userBubbleItems} className={styles["bubble-item"]} />
        )}
        {row.assistantGroup && renderAssistantGroup(row.assistantGroup, rowIndex, deps)}
      </>
    );
  },
);

MessageRow.displayName = "MessageRow";

const VirtualizedMessageList: React.FC<{
  messages: ChatMessage[];
  deps: RenderDeps;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}> = ({ messages, deps, scrollContainerRef }) => {
  const rows = useMemo(() => buildConversationRows(messages), [messages]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    getItemKey: (index) => rows[index]?.key ?? index,
    estimateSize: () => 240,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      className={styles["virtual-list"]}
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) {
          return null;
        }

        return (
          <div
            key={row.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className={styles["virtual-row"]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <MessageRow row={row} rowIndex={virtualRow.index} deps={deps} />
          </div>
        );
      })}
    </div>
  );
};

const AIChat: React.FC<AIChatProps> = ({
  messages = [],
  historyMessages,
  liveMessages,
  contextStatus,
  loading = false,
  onSendMessage,
  onStopMessage,
  placeholder = "请输入消息...",
  disabled = false,
  commands,
  onCommandSelect,
  models,
  currentModel,
  onModelChange,
  onManageModels,
  modes,
  currentMode,
  onModeChange,
  title,
  onAddChat,
  onShowHistory,
  hasMoreHistory = false,
  isLoadingEarlierHistory = false,
  onLoadEarlierHistory,
  error,
  className,
  style,
}) => {
  const { getMessageActions } = useMessageActions();
  const messagesListRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const pendingHistoryScrollRef = useRef<{
    previousScrollTop: number;
    previousScrollHeight: number;
  } | null>(null);

  const mergedMessages = useMemo(() => {
    if (historyMessages || liveMessages) {
      return [...(historyMessages || []), ...(liveMessages || [])];
    }
    return messages;
  }, [historyMessages, liveMessages, messages]);

  const stableHistoryMessages = historyMessages || mergedMessages;

  const deps = useMemo<RenderDeps>(
    () => ({
      loading,
      commands,
      getMessageActions,
      handleSend: (content, isResume, resumePayload) =>
        onSendMessage?.(content, isResume, resumePayload),
    }),
    [loading, commands, getMessageActions, onSendMessage],
  );

  const handleScroll = useCallback(() => {
    if (!messagesListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesListRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useLayoutEffect(() => {
    if (isAtBottomRef.current && messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [mergedMessages, loading, contextStatus]);

  useLayoutEffect(() => {
    const pending = pendingHistoryScrollRef.current;
    if (!pending || !messagesListRef.current) {
      return;
    }

    const nextScrollHeight = messagesListRef.current.scrollHeight;
    const delta = nextScrollHeight - pending.previousScrollHeight;
    messagesListRef.current.scrollTop = pending.previousScrollTop + delta;
    pendingHistoryScrollRef.current = null;
  }, [stableHistoryMessages.length]);

  const hasPendingInterrupt = useMemo(() => {
    const lastMessage = mergedMessages[mergedMessages.length - 1];
    return !loading && lastMessage?.type === "interrupt";
  }, [loading, mergedMessages]);

  const handleUserSubmit = useCallback(
    (content: string) => {
      onSendMessage?.(content, hasPendingInterrupt);
    },
    [onSendMessage, hasPendingInterrupt],
  );

  const handleLoadEarlierHistory = useCallback(async () => {
    if (!onLoadEarlierHistory || !messagesListRef.current || isLoadingEarlierHistory) {
      return;
    }

    pendingHistoryScrollRef.current = {
      previousScrollTop: messagesListRef.current.scrollTop,
      previousScrollHeight: messagesListRef.current.scrollHeight,
    };

    const loaded = await onLoadEarlierHistory();
    if (!loaded) {
      pendingHistoryScrollRef.current = null;
    }
  }, [isLoadingEarlierHistory, onLoadEarlierHistory]);

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
          actionsDisabled={loading}
        />
      )}

      <div
        className={styles["messages-list"]}
        role="log"
        aria-label="消息列表"
        aria-live="polite"
      >
        <ScrollArea
          viewportRef={messagesListRef}
          onViewportScroll={handleScroll}
          contentStyle={{ minWidth: "none", paddingInline: "1.25rem" }}
        >
          {contextStatus && (
            <div className={styles["context-status"]}>
              {contextStatus.phase === "start" && "上下文压缩中"}
              {contextStatus.phase === "success" && "上下文压缩完成"}
              {contextStatus.phase === "fallback" && "上下文压缩降级"}
              {contextStatus.phase === "failed" && "上下文压缩失败"}
              ：{contextStatus.message}
            </div>
          )}

          {hasMoreHistory && (
            <button
              type="button"
              className={styles["history-load-more"]}
              onClick={() => void handleLoadEarlierHistory()}
              disabled={loading || isLoadingEarlierHistory}
            >
              {isLoadingEarlierHistory ? "加载中..." : HISTORY_LOAD_MORE_LABEL}
            </button>
          )}

          <VirtualizedMessageList
            messages={mergedMessages}
            deps={deps}
            scrollContainerRef={messagesListRef}
          />

          {loading && (
            <DotsJumpLoading
              size="small"
              speed={0.5}
              color="var(--chat-color-primary)"
            />
          )}
        </ScrollArea>
      </div>

      {error ? (
        <div
          className={styles["error-banner"]}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className={styles["sender-wrapper"]}>
        <EnhancedSender
          loading={loading}
          onSubmit={handleUserSubmit}
          onCancel={onStopMessage}
          placeholder={placeholder}
          disabled={disabled}
          commands={commands}
          onCommandSelect={onCommandSelect}
          models={models}
          currentModel={currentModel}
          onModelChange={onModelChange}
          onManageModels={onManageModels}
          modes={modes}
          currentMode={currentMode}
          onModeChange={onModeChange}
        />
      </div>
    </div>
  );
};

export default AIChat;

