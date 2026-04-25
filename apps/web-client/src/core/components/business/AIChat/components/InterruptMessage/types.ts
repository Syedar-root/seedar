import type {
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptContent,
} from "#pkg/seedar/types";
import type { ChatMessage } from "../../types";

export interface InterruptRendererProps {
  content: string | InterruptContent<AiInterruptPayload>;
  message?: ChatMessage;
  onSubmit?: (
    data: string,
    isResume: boolean,
    resumePayload?: AiChatResumeDto,
  ) => void;
  disabled?: boolean;
}
