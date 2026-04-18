export interface TextQuestionProps {
  question: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}
