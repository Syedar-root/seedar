import React, { useMemo, useRef, useCallback } from "react";
import { Sender, Suggestion } from "@ant-design/x";
import type {
  SlotConfigType,
  ActionsComponents,
} from "@ant-design/x/es/sender/interface";
import type { GetRef } from "antd";
import { Flex } from "antd";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Bot } from "lucide-react";
import styles from "./EnhancedSender.module.scss";
import type { EnhancedSenderProps } from "./types";
import clsx from "clsx";

type SenderRef = GetRef<typeof Sender>;

interface SuggestionItemType {
  label: React.ReactNode;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

const EnhancedSender: React.FC<EnhancedSenderProps> = ({
  loading = false,
  onSubmit,
  placeholder = "输入消息，或用 / 触发命令...",
  disabled = false,
  commands,
  onCommandSelect,
  models,
  currentModel,
  onModelChange,
}) => {
  const senderRef = useRef<SenderRef>(null);

  const commandSuggestions: SuggestionItemType[] = useMemo(() => {
    if (!commands || commands.length === 0) return [];
    return commands.map((cmd) => ({
      label: cmd.label,
      value: cmd.key,
      icon: cmd.icon,
      description: cmd.description,
    }));
  }, [commands]);

  const slotConfig = useMemo<SlotConfigType[]>(() => {
    if (!commands || commands.length === 0) return [];
    return [{ type: "text" as const, value: "", props: { placeholder } }];
    // return [
    //   { type: "text" as const, value: "/" },
    //   {
    //     type: "select" as const,
    //     key: "command-selector",
    //     props: {
    //       options: commands.map((cmd) => cmd.label),
    //       placeholder: "选择命令...",
    //     },
    //   },
    // ];
  }, [commands]);

  const handleCommandSelect = useCallback(
    (value: string) => {
      const command = commands?.find((cmd) => cmd.key === value);
      if (command && onCommandSelect) {
        onCommandSelect(command);
      }
      const item = commandSuggestions.find((s) => s.value === value);
      if (item) {
        senderRef.current?.insert?.(
          [
            {
              type: "tag" as const,
              key: `${value}_${Date.now()}`,
              props: {
                label: item.label,
                value: value,
              },
            },
          ],
          "cursor",
          "/",
        );
      }
    },
    [commands, onCommandSelect, commandSuggestions],
  );

  const getCurrentModelLabel = () => {
    if (!models || !currentModel) return "选择模型";
    const model = models.find((m) => m.key === currentModel);
    return model?.label || "选择模型";
  };

  const getCurrentModelIcon = () => {
    if (!models || !currentModel) return <Bot size={14} />;
    const model = models.find((m) => m.key === currentModel);
    return model?.icon || <Bot size={14} />;
  };

  const modelMenuItems = useMemo(() => {
    if (!models || models.length === 0) return [];
    return models.map((model) => ({
      value: model.key,
      label: (
        <div className={styles["menu-item-content"]}>
          <div className={styles["menu-item-label"]}>
            {model.icon}
            <span>{model.label}</span>
          </div>
          {model.description && (
            <div className={styles["menu-item-description"]}>
              {model.description}
            </div>
          )}
        </div>
      ),
      onClick: () => onModelChange?.(model.key),
    }));
  }, [models, onModelChange]);

  const footer = (
    _: React.ReactNode,
    info: { components: ActionsComponents },
  ) => {
    const { SendButton, LoadingButton } = info.components;
    return (
      <Flex justify="space-between" align="center">
        {models && models.length > 0 ? (
          <Menu.Root>
            <Menu.Trigger
              className={styles["model-switch-button"]}
              disabled={disabled}
            >
              {getCurrentModelIcon()}
              <span>{getCurrentModelLabel()}</span>
              <ChevronDown size={12} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="top" align="end">
                <Menu.Popup className={styles["model-menu-listbox"]}>
                  {modelMenuItems.map((item) => (
                    <Menu.Item
                      key={item.value}
                      onClick={item.onClick}
                      className={styles["model-menu-item"]}
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : (
          <span></span>
        )}
        <Flex align="center" gap="small">
          {loading ? (
            <LoadingButton />
          ) : (
            <SendButton
              className={clsx(styles["send-button"])}
              type="primary"
              disabled={disabled}
            />
          )}
        </Flex>
      </Flex>
    );
  };

  const handleSubmit = useCallback(
    (value: string) => {
      onSubmit?.(value);
      senderRef.current?.clear();
    },
    [onSubmit],
  );

  return (
    <div className={styles["enhanced-sender-wrapper"]}>
      {commandSuggestions.length > 0 ? (
        <Suggestion<SuggestionItemType>
          items={commandSuggestions}
          onSelect={(value) => {
            handleCommandSelect(value);
          }}
        >
          {({ onTrigger, onKeyDown }) => (
            <Sender
              suffix={false}
              ref={senderRef}
              loading={loading}
              onSubmit={handleSubmit}
              placeholder={placeholder}
              disabled={disabled}
              slotConfig={slotConfig}
              footer={footer}
              onKeyDown={(e) => {
                if (e.key === "/") {
                  onTrigger();
                }
                return onKeyDown(e);
              }}
            />
          )}
        </Suggestion>
      ) : (
        <Sender
          ref={senderRef}
          loading={loading}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          disabled={disabled}
          footer={footer}
          suffix={false}
        />
      )}
    </div>
  );
};

export default EnhancedSender;
