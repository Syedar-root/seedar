import React, { useEffect, useMemo, useState } from "react";
import { useAiApi, useAis, useCreateAiSession } from "#pkg/seedar/ui-react";
import { AIChat } from "./";
import { useChatState } from "./hooks/useChatState.hook";
import { useSSEHandler } from "./hooks/useSSEHandler.hook";
import type { ChatMessage, SSEData } from "./types";
import styles from "./AIChat.Preview.module.scss";
import { AiSessionResponse } from "#pkg/seedar/types";

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

  const handleSendMessage = async (
    content: string,
    isResume: boolean = false,
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
      // isResume表示从中断恢复，中断信息不需要添加到消息列表
      const userMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "text",
        content,
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
        },
        {
          onSession: (data) => {},
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

  const handleAddChat = async () => {
    chatState.setMessages([]);
    setCurrentSession(null);
  };

  const handleModelChange = (modelKey: string) => {
    console.log("modelKey", modelKey);
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
          models={models}
          currentModel={currentModel}
          onModelChange={handleModelChange}
        />
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
      </section>

      {/* <section className={styles["preview-section"]}>
        <h2 className={styles["section-title"]}>无 AI ID 示例（仅本地消息）</h2>
        <AIChat
          messages={[]}
          placeholder="输入消息..."
          title="本地对话"
          onSendMessage={(content: string) => {
            console.log("本地发送消息:", content);
          }}
        />
      </section> */}
    </div>
  );
};

export default AIChatPreview;
