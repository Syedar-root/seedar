export interface ChoiceOptionItem {
  label: string;
  value: string;
  description?: string;
  isOther?: boolean;
}

export interface ChoiceQuestionProps {
  question: string;
  options: ChoiceOptionItem[];
  value: string[];
  otherInput: string;
  onChange: (value: string[]) => void;
  onOtherInputChange: (value: string) => void;
}