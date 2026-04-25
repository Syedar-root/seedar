import React, { useMemo, useRef, useCallback } from "react";
import { Sender, Suggestion } from "@ant-design/x";
import type {
  SlotConfigType,
  ActionsComponents,
} from "@ant-design/x/es/sender/interface";
import type { GetRef } from "antd";
import { Flex } from "antd";
import { Menu } from "@base-ui/react/menu";
import {
  Bot,
  ChevronDown,
  MessageSquareText,
} from "lucide-react";
import styles from "./EnhancedSender.module.scss";
import type { EnhancedSenderProps } from "./types";
import clsx from "clsx";
import type { AiChatMode } from "#pkg/seedar/types";

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
  modes,
  currentMode,
  onModeChange,
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

  const getCurrentModeLabel = () => {
    if (!modes || !currentMode) return "选择模式";
    const mode = modes.find((item) => item.key === currentMode);
    return mode?.label || "选择模式";
  };

  const getCurrentModeIcon = () => {
    if (!modes || !currentMode) return <MessageSquareText size={14} />;
    const mode = modes.find((item) => item.key === currentMode);
    return mode?.icon || <MessageSquareText size={14} />;
  };

  const buildMenuItems = <
    TItem extends {
      key: string;
      label: string;
      description?: string;
      icon?: React.ReactNode;
    },
  >(
    items: TItem[] | undefined,
    onSelect?: (key: TItem["key"]) => void,
  ) => {
    if (!items || items.length === 0) return [];
    return items.map((item) => ({
      value: item.key,
      label: (
        <div className={styles["menu-item-content"]}>
          <div className={styles["menu-item-label"]}>
            {item.icon}
            <span>{item.label}</span>
          </div>
          {item.description && (
            <div className={styles["menu-item-description"]}>
              {item.description}
            </div>
          )}
        </div>
      ),
      onClick: () => onSelect?.(item.key),
    }));
  };

  const modelMenuItems = buildMenuItems(models, onModelChange);

  const modeMenuItems = buildMenuItems(modes, (modeKey) =>
    onModeChange?.(modeKey as AiChatMode),
  );

  const footer = (
    _: React.ReactNode,
    info: { components: ActionsComponents },
  ) => {
    const { SendButton, LoadingButton } = info.components;
    return (
      <Flex justify="space-between" align="center">
        <Flex align="center" gap="small">
          {modes && modes.length > 0 ? (
            <Menu.Root>
              <Menu.Trigger
                className={styles["selector-button"]}
                disabled={disabled}
              >
                {getCurrentModeIcon()}
                <span>{getCurrentModeLabel()}</span>
                <ChevronDown size={12} />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="top" align="start">
                  <Menu.Popup className={styles["selector-menu-listbox"]}>
                    {modeMenuItems.map((item) => (
                      <Menu.Item
                        key={item.value}
                        onClick={item.onClick}
                        className={styles["selector-menu-item"]}
                      >
                        {item.label}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          ) : null}
          {models && models.length > 0 ? (
            <Menu.Root>
              <Menu.Trigger
                className={styles["selector-button"]}
                disabled={disabled}
              >
                {getCurrentModelIcon()}
                <span>{getCurrentModelLabel()}</span>
                <ChevronDown size={12} />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="top" align="start">
                  <Menu.Popup className={styles["selector-menu-listbox"]}>
                    {modelMenuItems.map((item) => (
                      <Menu.Item
                        key={item.value}
                        onClick={item.onClick}
                        className={styles["selector-menu-item"]}
                      >
                        {item.label}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          ) : null}
        </Flex>
        <Flex align="center" gap="small">
          {loading ? (
            <LoadingButton className={styles["loading-button"]} />
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
