import React from "react";
import { Input } from "@base-ui/react/input";
import type { TextQuestionProps } from "./types";
import styles from "./TextQuestion.module.scss";

const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  value,
  disabled = false,
  onChange,
}) => {
  return (
    <div>
      <div className={styles["question-title"]}>{question}</div>
      <Input
        value={value}
        onValueChange={(val) => onChange(val)}
        disabled={disabled}
        placeholder="请输入..."
        className={styles["input-wrapper"]}
        autoFocus={!disabled}
      />
    </div>
  );
};

export default TextQuestion;
