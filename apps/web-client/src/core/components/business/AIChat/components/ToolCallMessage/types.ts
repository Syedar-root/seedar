export interface ToolCallMessageProps {
  meta?: {
    name?: string;
    tool_call?: {
      id: string;
      name: string;
    };
  };
  toolCallId?: string;
  resultContent?: string;
}
