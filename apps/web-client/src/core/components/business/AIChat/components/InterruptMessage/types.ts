import type {
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptContent,
} from "#pkg/seedar/types";

export interface InterruptRendererProps {
  content: string | InterruptContent<AiInterruptPayload>;
  onSubmit?: (
    data: string,
    isResume: boolean,
    resumePayload?: AiChatResumeDto,
  ) => void;
  disabled?: boolean;
}
