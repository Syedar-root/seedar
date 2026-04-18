import type { CommandItem } from "../types";

export const buildCommandMessage = (command: CommandItem): string => {
  return `/${command.key}`;
};

export const resolveCommandFromMessage = (
  message: string,
  commands: CommandItem[] = [],
): CommandItem | undefined => {
  const commandKey = message.trim().replace(/^\//, "");
  return commands.find((command) => command.key === commandKey);
};

export const formatMessageForDisplay = (
  message: string,
  commands: CommandItem[] = [],
): string => {
  const command = resolveCommandFromMessage(message, commands);
  return command ? `/${command.label}` : message;
};
