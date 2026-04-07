export type YieldType =
  | "interrupt"
  | "tool_call"
  | "tool_result"
  | "text"
  | "reasoning"
  | "error";

export interface AiChatRequestDto {
  aiId: string;
  message: string;
  stream?: boolean;
  sessionId?: string;
  isResume?: boolean;
}

export interface AiStreamChunk {
  content: string | AskQuestionParams["questions"];
  type: YieldType;
  done: boolean;
  role?: string;
  meta?: {
    tool_call?: { id: string; name: string; [key: string]: any };
    tool_result?: { tool_call_id: string };
  };
}

export interface AiSseEvent {
  type: "ping" | "session" | "message" | "done" | "error";
  data: string | AiStreamChunk;
  sessionId?: string;
}

export interface AskQuestion {
  questions: Array<{
    id: string;
    question: string;
    type: "confirm" | "choice" | "text";
    options?: {
      label: string;
      value: string;
      description?: string;
      isOther?: boolean;
    }[];
    multiple?: boolean;
  }>;
}

export type AskQuestionParams = AskQuestion;
