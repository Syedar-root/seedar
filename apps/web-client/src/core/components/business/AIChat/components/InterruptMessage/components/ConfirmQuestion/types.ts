export interface ConfirmQuestionProps {
  question: string;
  value: string | undefined;
  disabled?: boolean;
  onChange: (value: string) => void;
}
