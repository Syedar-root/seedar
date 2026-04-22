import React, { useEffect, useMemo, useState } from "react";
import { useAiApi, useAis, useCreateAiSession } from "#pkg/seedar/ui-react";
import { AIChat } from "./";
import { useChatState } from "./hooks/useChatState.hook";
import { useSSEHandler } from "./hooks/useSSEHandler.hook";
import { useWorkflowInterruptExecutor } from "./hooks/useWorkflowInterruptExecutor.hook";
import type { ChatMessage, CommandItem, SSEData } from "./types";
import styles from "./AIChat.Preview.module.scss";
import type { AiChatResumeDto, AiSessionResponse } from "#pkg/seedar/types";
import { formatMessageForDisplay } from "./utils/command.utils";

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

const AIChatPreview: React.FC = () => {
  const [currentModel, setCurrentModel] = useState("gpt-4");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] =
    useState<AiSessionResponse | null>(null);

  const chatState = useChatState([]);
  const { handleSSEData } = useSSEHandler({
    onNewMessage: chatState.addMessage,
    onUpdateMessage: chatState.updateMessage,
  });

  const aiApi = useAiApi();
  const { data: aisData } = useAis();
  const { mutateAsync: createSession } = useCreateAiSession();
  const commands = useMemo(() => Object.values(AI_CHAT_COMMANDS_RECORD), []);

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
          },
        },
      ));

    if (!isResume) {
      const userMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "text",
        content,
        displayContent: formatMessageForDisplay(content, commands),
        role: "user",
        timestamp: Date.now(),
        done: true,
      };
      chatState.addMessage(userMessage);
    }
    setIsLoading(true);
    setError(null);

    try {
      const controller = aiApi.streamChat(
        {
          aiId: currentModel || "",
          message: content,
          stream: true,
          sessionId: session?.id || undefined,
          isResume: isResume || false,
          resumePayload,
        },
        {
          onSession: () => {},
          onMessage: (chunk) => {
            const sseData: SSEData = {
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
            handleSSEData(sseData, chunk.sid);
          },
          onDone: () => {
            setIsLoading(false);
          },
          onError: (err) => {
            setIsLoading(false);
            setError(err);
          },
        },
      );

      return controller;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  useWorkflowInterruptExecutor({
    enabled: !isLoading,
    messages: chatState.messages,
    onResume: async (resumePayload) => {
      setIsLoading(true);
      try {
        await handleSendMessage("", true, resumePayload);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
  });

  const handleAddChat = async () => {
    chatState.setMessages([]);
    setCurrentSession(null);
  };

  const handleModelChange = (modelKey: string) => {
    setCurrentModel(modelKey);
  };

  const models = useMemo(() => {
    return (
      aisData?.data
        ?.filter((ai) => ai.status === "active")
        .map((ai) => ({
          key: ai.id,
          label: ai.name,
          description: ai.description,
        })) || []
    );
  }, [aisData]);

  useEffect(() => {
    setCurrentModel(models[0]?.key || "");
  }, [models]);

  return (
    <div className={styles["preview-container"]}>
      <section className={styles["preview-section"]}>
        <AIChat
          style={{ height: "100%", border: "none" }}
          messages={chatState.messages}
          loading={isLoading}
          placeholder="输入 / 获取命令"
          title="AI 智能助手"
          onAddChat={handleAddChat}
          onShowHistory={() => {
            console.log("显示历史记录");
          }}
          onSendMessage={handleSendMessage}
          commands={commands}
          models={models}
          currentModel={currentModel}
          onModelChange={handleModelChange}
        />
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
      </section>
    </div>
  );
};

export default AIChatPreview;
