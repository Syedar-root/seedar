import type {
  StartWorkflowRequest,
  WorkflowRunResult,
} from './ai-workflow.types';

export interface AskQuestionOption {
  label: string;
  value: string;
  description?: string;
  isOther?: boolean;
}

export interface AskQuestionAnswer {
  questionId: string;
  question?: string;
  answer?: string | string[];
}

export interface AskQuestionItem {
  id: string;
  question: string;
  type: 'confirm' | 'choice' | 'text';
  options?: AskQuestionOption[];
  multiple?: boolean;
}

export interface AskQuestion {
  questions: AskQuestionItem[];
  answers?: AskQuestionAnswer[];
}

export type AskQuestionParams = AskQuestion;

export type AskUserInterrupt = {
  kind: 'ask_user';
} & AskQuestion;

export interface WorkflowRunInterrupt {
  kind: 'workflow_run';
  interruptId: string;
  request: StartWorkflowRequest;
}

export type AiInterruptPayload =
  | AskUserInterrupt
  | WorkflowRunInterrupt;

export interface AskQuestionResult {
  kind: 'ask_user_result';
  answers: AskQuestionAnswer[];
}

export type InterruptResultPayload =
  | AskQuestionResult
  | WorkflowRunResult;
