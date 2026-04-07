export interface ConfirmQuestionProps {
  question: string;
  value: string | undefined;
  onChange: (value: string) => void;
}