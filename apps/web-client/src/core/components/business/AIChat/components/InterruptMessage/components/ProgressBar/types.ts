export interface QuestionInfo {
  id: string;
  canSkip?: boolean;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  answeredIds: Set<string>;
  questionInfos: QuestionInfo[];
  onJumpTo: (index: number) => void;
}