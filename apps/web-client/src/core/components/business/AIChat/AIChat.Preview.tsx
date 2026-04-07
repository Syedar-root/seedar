import React, { useState } from "react";
import { AIChat } from "./";
import { mockChatMessages, mockCommands, mockModels } from "./mock/data";
import type { ChatMessage, CommandItem } from "./types";
import styles from "./AIChat.Preview.module.scss";

const AIChatPreview: React.FC = () => {
  const [currentModel, setCurrentModel] = useState("gpt-4");

  return (
    <div className={styles["preview-container"]}>
      <h1 className={styles["preview-title"]}>AIChat 组件展示</h1>

      <section className={styles["preview-section"]}>
        <h2 className={styles["section-title"]}>
          完整对话示例（包含所有消息类型 + 新功能）
        </h2>
        <AIChat
          messages={mockChatMessages as ChatMessage[]}
          placeholder="输入 / 获取命令"
          title="AI 智能助手"
          onAddChat={() => {
            console.log("添加新对话");
            alert("添加新对话功能触发！");
          }}
          onShowHistory={() => {
            console.log("显示历史记录");
            alert("显示历史记录功能触发！");
          }}
          commands={mockCommands}
          onCommandSelect={(command: CommandItem) => {
            console.log("选择命令:", command);
            alert(`选择命令: ${command.label}`);
          }}
          models={mockModels}
          currentModel={currentModel}
          onModelChange={(modelKey: string) => {
            console.log("切换模型:", modelKey);
            setCurrentModel(modelKey);
            alert(`切换模型到: ${modelKey}`);
          }}
          onSendMessage={(content: string) => {
            console.log("发送消息:", content);
          }}
        />
      </section>
    </div>
  );
};

export default AIChatPreview;
