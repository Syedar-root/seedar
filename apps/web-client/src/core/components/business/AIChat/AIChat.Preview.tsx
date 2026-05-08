import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useAiApi, useAis, useCreateAiSession } from "#pkg/seedar/ui-react";
import { AIChat } from "./";
import { useSSEHandler } from "./hooks/useSSEHandler.hook";
import { useWorkflowInterruptExecutor } from "./hooks/useWorkflowInterruptExecutor.hook";
import { ModelConfigDialog, HistorySessionMenu } from "./components";
import { useAiChatScenesStore } from "@/core/store";
import type { ChatMessage, ChatModeItem, CommandItem, SSEData } from "./types";
import styles from "./AIChat.Preview.module.scss";
import type {
  AiChatScene,
  AiChatMode,
  AiChatResumeDto,
  AiContextStatusEvent,
  AiResponse,
  AiSessionResponse,
  AiSessionMessageResponse,
} from "#pkg/seedar/types";
import { formatMessageForDisplay } from "./utils/command.utils";
import { MessageSquareText, Workflow } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { WorkflowRunResult } from "#pkg/seedar/types";
import { useDeleteAiSession } from "#pkg/seedar/ui-react";

const AI_CHAT_SESSION_STORAGE_KEY = "seedar.ai-chat.preview.session";
const WORKFLOW_INTERRUPT_SCAN_LIMIT = 200;

interface AIChatPreviewCache {
  historyMessages: ChatMessage[];
  historyCursor: string | null;
  currentModel: string;
  currentMode: AiChatMode;
  error: string | null;
  currentSession: AiSessionResponse | null;
  handledInterruptIds: string[];
}

type StreamController = { close: () => void };

const readPreviewCache = (): AIChatPreviewCache | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AI_CHAT_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AIChatPreviewCache) : null;
  } catch {
    return null;
  }
};

const clearPreviewCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AI_CHAT_SESSION_STORAGE_KEY);
};

const AI_CHAT_COMMANDS_RECORD = {
  dataQuery: {
    key: "data-query",
    label: "数据查询",
    description: "让 agent 进入数据查询能力。",
  },
  chartRecommend: {
    key: "chart-recommend",
    label: "图表推荐",
    description: "让 agent 进入图表推荐能力，优先使用图表分析和 workflow 工具。",
  },
  panelWorkflow: {
    key: "chart-workflow-create-panel",
    label: "创建图表",
    description: "让 agent 优先选择预定义 workflow，协助创建图表面板。",
  },
} satisfies Record<string, CommandItem>;

const mapSessionMessageToChatMessage = (
  message: AiSessionMessageResponse,
): ChatMessage => {
  const rawCreatedAt = message.createdAt as unknown as string | Date;
  const createdAt =
    typeof rawCreatedAt === "string" &&
    !/[zZ]|[+-]\d{2}:\d{2}$/.test(rawCreatedAt)
      ? dayjs(rawCreatedAt.replace(" ", "T") + "Z")
      : dayjs(rawCreatedAt);

  const workflowResult = (message.metaJson as Record<string, unknown> | undefined)
    ?.workflowResult as WorkflowRunResult | undefined;
  const workflowExecution =
    message.messageType === "interrupt" &&
    workflowResult?.kind === "workflow_result"
      ? {
          interruptId: workflowResult.interruptId,
          workflowId: workflowResult.workflowId,
          status: workflowResult.status,
          steps: Array.isArray(workflowResult.result?.steps)
            ? (workflowResult.result?.steps as Array<Record<string, unknown>>).map(
                (step, index) => ({
                  key:
                    typeof step.key === "string"
                      ? step.key
                      : `${workflowResult.workflowId}-${index}`,
                  target:
                    typeof step.target === "string" ? step.target : "",
                  title: typeof step.title === "string" ? step.title : "执行步骤",
                  description:
                    typeof step.description === "string"
                      ? step.description
                      : undefined,
                  status:
                    step.status === "pending" ||
                    step.status === "running" ||
                    step.status === "done" ||
                    step.status === "failed"
                      ? step.status
                      : workflowResult.status,
                  result:
                    step.result && typeof step.result === "object"
                      ? (step.result as Record<string, unknown>)
                      : undefined,
                  error:
                    step.error && typeof step.error === "object"
                      ? (step.error as { code: string; message: string })
                      : undefined,
                }),
              )
            : [],
          error: workflowResult.error,
        }
      : undefined;

  return {
    id: `${message.id}`,
    type: message.messageType as ChatMessage["type"],
    content:
      message.contentText ??
      (message.contentJson as ChatMessage["content"]) ??
      "",
    role: (message.role as ChatMessage["role"]) || "act",
    timestamp: createdAt.valueOf(),
    done: true,
    meta: (message.metaJson as ChatMessage["meta"]) || undefined,
    workflowExecution,
  };
};

const mergeMessages = (history: ChatMessage[], live: ChatMessage[]) => {
  const isTextUserMessage = (message: ChatMessage) =>
    message.role === "user" &&
    message.type === "text" &&
    typeof message.content === "string";

  const isOptimisticUserMessage = (message: ChatMessage) =>
    isTextUserMessage(message) &&
    Boolean((message.meta as Record<string, unknown> | undefined)?.optimistic);

  const hasCanonicalUserMessage = (candidate: ChatMessage) =>
    history.some((message) => {
      if (!isTextUserMessage(message) || !isTextUserMessage(candidate)) {
        return false;
      }

      if (message.content !== candidate.content) {
        return false;
      }

      return Math.abs(message.timestamp - candidate.timestamp) <= 2 * 60 * 1000;
    });

  const seenIds = new Set(history.map((message) => message.id));
  const merged = [...history];

  live.forEach((message) => {
    if (isOptimisticUserMessage(message) && hasCanonicalUserMessage(message)) {
      return;
    }

    if (seenIds.has(message.id)) {
      return;
    }
    seenIds.add(message.id);
    merged.push(message);
  });

  return merged;
};

const AIChatPreview: React.FC = () => {
  const cachedState = useMemo(() => readPreviewCache(), []);
  const [currentModel, setCurrentModel] = useState(
    cachedState?.currentModel || "gpt-4",
  );
  const [currentMode, setCurrentMode] = useState<AiChatMode>(
    cachedState?.currentMode || "chat",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(cachedState?.error || null);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<AiSessionResponse | null>(
    cachedState?.currentSession || null,
  );
  const [handledInterruptIds, setHandledInterruptIds] = useState<string[]>(
    cachedState?.handledInterruptIds || [],
  );
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>(
    cachedState?.historyMessages || [],
  );
  const [historyCursor, setHistoryCursor] = useState<string | null>(
    cachedState?.historyCursor || null,
  );
  const [historyLoadedSessionId, setHistoryLoadedSessionId] = useState<
    string | null
  >(cachedState?.currentSession?.id || null);
  const [isLoadingEarlierHistory, setIsLoadingEarlierHistory] =
    useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [contextStatus, setContextStatus] = useState<AiContextStatusEvent | null>(
    null,
  );
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [sessionList, setSessionList] = useState<AiSessionResponse[]>([]);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);

  const activeStreamControllerRef = useRef<StreamController | null>(null);
  const historyRequestTokenRef = useRef(0);
  const liveMessagesRef = useRef<ChatMessage[]>([]);
  const contextStatusTimerRef = useRef<number | null>(null);
  const historyMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const activeScenes = useAiChatScenesStore((state) => state.scenes);

  const { handleSSEData } = useSSEHandler({
    onNewMessage: (message) => {
      setLiveMessages((prev) => [...prev, message]);
    },
    onUpdateMessage: (id, updates) => {
      setLiveMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== id) {
            return msg;
          }
          return typeof updates === "function" ? updates(msg) : { ...msg, ...updates };
        }),
      );
    },
  });

  useEffect(() => {
    liveMessagesRef.current = liveMessages;
  }, [liveMessages]);

  const aiApi = useAiApi();
  const deleteSessionMutation = useDeleteAiSession();
  const { data: aisData } = useAis();
  const { mutateAsync: createSession } = useCreateAiSession();
  const commands = useMemo(() => Object.values(AI_CHAT_COMMANDS_RECORD), []);
  const requestScenes = useMemo<AiChatScene[]>(() => {
    if (activeScenes.length > 0) {
      return activeScenes;
    }

    return [
      {
        path: `${location.pathname}${location.search}${location.hash}`,
      },
    ];
  }, [activeScenes, location.hash, location.pathname, location.search]);

  const loadSessionHistory = useCallback(
    async (sessionId: string) => {
      const requestToken = ++historyRequestTokenRef.current;
      try {
        const page = await aiApi.listSessionMessages(sessionId, undefined, 50);
        if (requestToken !== historyRequestTokenRef.current) {
          return;
        }
        setHistoryMessages(page.data.map(mapSessionMessageToChatMessage));
        setHistoryCursor(page.nextCursor ?? null);
        setHistoryLoadedSessionId(sessionId);
      } catch (requestError) {
        if (requestToken !== historyRequestTokenRef.current) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "加载历史消息失败",
        );
      }
    },
    [aiApi],
  );

  const loadOlderHistory = useCallback(async (): Promise<boolean> => {
    if (!currentSession?.id || !historyCursor || isLoadingEarlierHistory) {
      return false;
    }

    const requestToken = ++historyRequestTokenRef.current;
    setIsLoadingEarlierHistory(true);
    try {
      const page = await aiApi.listSessionMessages(
        currentSession.id,
        historyCursor,
        50,
      );
      if (requestToken !== historyRequestTokenRef.current) {
        return false;
      }
      setHistoryMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.id));
        const olderMessages = page.data
          .map(mapSessionMessageToChatMessage)
          .filter((message) => !existingIds.has(message.id));
        return [...olderMessages, ...prev];
      });
      setHistoryCursor(page.nextCursor ?? null);
      return true;
    } catch (requestError) {
      if (requestToken !== historyRequestTokenRef.current) {
        return false;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "加载历史消息失败",
      );
      return false;
    } finally {
      setIsLoadingEarlierHistory(false);
    }
  }, [aiApi, currentSession?.id, historyCursor, isLoadingEarlierHistory]);

  const loadSessionList = useCallback(async () => {
    setIsSessionListLoading(true);
    setSessionListError(null);
    try {
      const response = await aiApi.findSessions(1, 50);
      setSessionList(response.data);
    } catch (requestError) {
      setSessionListError(
        requestError instanceof Error
          ? requestError.message
          : "加载历史会话失败",
      );
    } finally {
      setIsSessionListLoading(false);
    }
  }, [aiApi]);

  const handleShowHistory = () => {
    setIsHistoryMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        void loadSessionList();
      }
      return next;
    });
  };

  const handleSelectSession = (session: AiSessionResponse) => {
    activeStreamControllerRef.current?.close();
    activeStreamControllerRef.current = null;
    historyRequestTokenRef.current += 1;
    setIsLoading(false);
    setError(null);
    setContextStatus(null);
    setHandledInterruptIds([]);
    setHistoryMessages([]);
    setHistoryCursor(null);
    setHistoryLoadedSessionId(null);
    setIsLoadingEarlierHistory(false);
    setLiveMessages([]);
    setCurrentSession(session);
    setIsHistoryMenuOpen(false);
  };

  const handleDeleteSession = async (session: AiSessionResponse) => {
    const confirmed = window.confirm(`确定删除「${session.title || "新对话"}」吗？`);
    if (!confirmed) {
      return;
    }

    setSessionList((prev) => prev.filter((item) => item.id !== session.id));

    await deleteSessionMutation.mutateAsync(session.id);
    await loadSessionList();
    if (currentSession?.id === session.id) {
      handleAddChat();
    }
  };

  const handleSendMessage = async (
    content: string,
    isResume: boolean = false,
    resumePayload?: AiChatResumeDto,
  ) => {
    const session =
      currentSession ||
      (await createSession(
        {},
        {
          onSuccess: (data) => {
            data.title = data.title || "新对话";
            setCurrentSession(data);
            setSessionList((prev) => {
              if (prev.some((item) => item.id === data.id)) {
                return prev;
              }
              return [data, ...prev];
            });
          },
        },
      ));

    if (session?.id && !currentSession?.id) {
      historyRequestTokenRef.current += 1;
      setHistoryLoadedSessionId(session.id);
      setCurrentSession(session);
    }

    if (!isResume) {
      const userMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: "text",
        content,
        displayContent: formatMessageForDisplay(content, commands),
        role: "user",
        timestamp: Date.now(),
        done: true,
        meta: { optimistic: true },
      };
      setLiveMessages((prev) => [...prev, userMessage]);
    }

    setIsLoading(true);
    setError(null);

    activeStreamControllerRef.current?.close();
    activeStreamControllerRef.current = null;

    try {
      const controller = aiApi.streamChat(
        {
          aiId: currentModel || "",
          message: content,
          stream: true,
          sessionId: session?.id || undefined,
          mode: currentMode,
          scenes: requestScenes,
          isResume: isResume || false,
          resumePayload,
        },
        {
          onSession: () => {},
          onMessage: (chunk) => {
            const nextSseData: SSEData = {
              type: chunk.type,
              data: {
                content: chunk.content,
                type: chunk.type,
                done: chunk.done,
                role: chunk.role as ChatMessage["role"],
                sessionId: session?.id || "",
                meta: chunk.meta,
              },
            };
            handleSSEData(nextSseData, chunk.sid);
          },
          onContext: (event) => {
            setContextStatus(event);
            if (contextStatusTimerRef.current) {
              window.clearTimeout(contextStatusTimerRef.current);
            }
            contextStatusTimerRef.current = window.setTimeout(() => {
              setContextStatus((prev) =>
                prev && prev.sessionId === event.sessionId ? null : prev,
              );
            }, 3000);
          },
          onSessionTitle: ({ sessionId, title }) => {
            if (!title?.trim()) {
              return;
            }

            setCurrentSession((prev) => {
              if (!prev || prev.id !== sessionId) {
                return prev;
              }
              return { ...prev, title };
            });
            setSessionList((prev) =>
              prev.map((item) =>
                item.id === sessionId ? { ...item, title } : item,
              ),
            );
          },
          onDone: async ({ isOver }) => {
            // 聊天区 loading 只表达“本轮回复是否完成”，首个 done 到达即结束 loading。
            setIsLoading(false);
            if (!isOver) {
              return;
            }

            activeStreamControllerRef.current = null;
            historyRequestTokenRef.current += 1;
            setHistoryMessages((prev) => mergeMessages(prev, liveMessagesRef.current));
            setLiveMessages([]);
            if (session?.id) {
              await loadSessionList();
            }
          },
          onError: (requestError) => {
            activeStreamControllerRef.current = null;
            setIsLoading(false);
            setError(requestError);
          },
        },
      );

      activeStreamControllerRef.current = controller;
      return controller;
    } catch (requestError) {
      setIsLoading(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to send message",
      );
      return undefined;
    }
  };

  const handleStopMessage = () => {
    activeStreamControllerRef.current?.close();
    activeStreamControllerRef.current = null;
    historyRequestTokenRef.current += 1;
    setIsLoading(false);
  };

  const interruptScanMessages = useMemo(() => {
    if (liveMessages.length >= WORKFLOW_INTERRUPT_SCAN_LIMIT) {
      return liveMessages.slice(-WORKFLOW_INTERRUPT_SCAN_LIMIT);
    }

    const historyTakeCount = WORKFLOW_INTERRUPT_SCAN_LIMIT - liveMessages.length;
    return [...historyMessages.slice(-historyTakeCount), ...liveMessages];
  }, [historyMessages, liveMessages]);

  useWorkflowInterruptExecutor({
    enabled: !isLoading,
    messages: interruptScanMessages,
    onUpdateMessage: (id, updates) => {
      const applyUpdates = (items: ChatMessage[]) =>
        items.map((msg) => {
          if (msg.id !== id) {
            return msg;
          }
          return typeof updates === "function" ? updates(msg) : { ...msg, ...updates };
        });
      setLiveMessages((prev) => applyUpdates(prev));
      setHistoryMessages((prev) => applyUpdates(prev));
    },
    persistedHandledInterruptIds: handledInterruptIds,
    onHandledInterruptIdsChange: setHandledInterruptIds,
    onResume: async (nextResumePayload) => {
      setIsLoading(true);
      try {
        await handleSendMessage("", true, nextResumePayload);
      } catch (requestError) {
        setIsLoading(false);
        throw requestError;
      }
    },
  });

  const handleAddChat = async () => {
    activeStreamControllerRef.current?.close();
    activeStreamControllerRef.current = null;
    historyRequestTokenRef.current += 1;
    setHistoryMessages([]);
    setHistoryCursor(null);
    setHistoryLoadedSessionId(null);
    setIsLoadingEarlierHistory(false);
    setLiveMessages([]);
    setCurrentSession(null);
    setError(null);
    setHandledInterruptIds([]);
    setContextStatus(null);
    clearPreviewCache();
  };

  const handleModelChange = (modelKey: string) => {
    setCurrentModel(modelKey);
  };

  const handleModeChange = (mode: AiChatMode) => {
    setCurrentMode(mode);
  };

  const activeAiModels = useMemo<AiResponse[]>(() => {
    return aisData?.data?.filter((ai) => ai.status === "active") || [];
  }, [aisData]);

  const models = useMemo(() => {
    return activeAiModels.map((ai) => ({
      key: ai.id,
      label: ai.name,
      description: ai.description,
    }));
  }, [activeAiModels]);

  const modes = useMemo<ChatModeItem[]>(() => {
    return [
      {
        key: "chat",
        label: "Chat",
        description: "纯对话模式，不暴露 workflow 工具",
        icon: <MessageSquareText size={14} />,
      },
      {
        key: "agent",
        label: "Agent",
        description: "Agent 模式，允许使用 workflow 工具",
        icon: <Workflow size={14} />,
      },
    ];
  }, []);

  useEffect(() => {
    if (models.length === 0) {
      setCurrentModel("");
      return;
    }

    setCurrentModel((previousModel) => {
      if (previousModel && models.some((model) => model.key === previousModel)) {
        return previousModel;
      }

      return models[0]?.key || "";
    });
  }, [models]);

  useEffect(() => {
    if (!currentSession?.id) {
      return;
    }

    if (historyLoadedSessionId === currentSession.id) {
      return;
    }

    void loadSessionHistory(currentSession.id);
  }, [currentSession?.id, historyLoadedSessionId, loadSessionHistory]);

  useEffect(() => {
    if (!isHistoryMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!historyMenuRef.current) {
        return;
      }
      if (historyMenuRef.current.contains(event.target as Node)) {
        return;
      }
      setIsHistoryMenuOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isHistoryMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot: AIChatPreviewCache = {
      historyMessages,
      historyCursor,
      currentModel,
      currentMode,
      error,
      currentSession,
      handledInterruptIds,
    };

    window.sessionStorage.setItem(
      AI_CHAT_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  }, [
    historyMessages,
    historyCursor,
    currentModel,
    currentMode,
    error,
    currentSession,
    handledInterruptIds,
  ]);

  useEffect(() => {
    return () => {
      if (contextStatusTimerRef.current) {
        window.clearTimeout(contextStatusTimerRef.current);
      }
      activeStreamControllerRef.current?.close();
      activeStreamControllerRef.current = null;
    };
  }, []);

  return (
    <div className={styles["preview-container"]}>
      <section className={styles["preview-section"]}>
        <AIChat
          style={{ height: "100%", border: "none" }}
          historyMessages={historyMessages}
          liveMessages={liveMessages}
          hasMoreHistory={Boolean(historyCursor)}
          isLoadingEarlierHistory={isLoadingEarlierHistory}
          onLoadEarlierHistory={loadOlderHistory}
          contextStatus={contextStatus}
          loading={isLoading}
          error={error}
          placeholder="输入 / 获取命令"
          title={currentSession?.title || "AI 智能助手"}
          onAddChat={handleAddChat}
          onShowHistory={handleShowHistory}
          onSendMessage={handleSendMessage}
          onStopMessage={handleStopMessage}
          commands={commands}
          models={models}
          currentModel={currentModel}
          onModelChange={handleModelChange}
          onManageModels={() => setIsModelDialogOpen(true)}
          modes={modes}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />

        <HistorySessionMenu
          open={isHistoryMenuOpen}
          loading={isSessionListLoading || deleteSessionMutation.isPending}
          error={sessionListError}
          sessions={sessionList}
          currentSessionId={currentSession?.id}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onClose={() => setIsHistoryMenuOpen(false)}
          anchorRef={historyMenuRef}
        />

        <ModelConfigDialog
          open={isModelDialogOpen}
          models={activeAiModels}
          currentModelId={currentModel}
          onClose={() => setIsModelDialogOpen(false)}
          onCurrentModelChange={(modelId) => {
            setCurrentModel(modelId);
          }}
          onCreated={(createdModel) => {
            setCurrentModel(createdModel.id);
          }}
          onUpdated={(updatedModel) => {
            if (currentModel === updatedModel.id) {
              setCurrentModel(updatedModel.id);
            }
          }}
          onDeleted={(deletedModelId) => {
            if (currentModel !== deletedModelId) {
              return;
            }

            const nextModel = activeAiModels.find(
              (model) => model.id !== deletedModelId,
            );
            setCurrentModel(nextModel?.id || "");
          }}
        />
      </section>
    </div>
  );
};

export default AIChatPreview;
