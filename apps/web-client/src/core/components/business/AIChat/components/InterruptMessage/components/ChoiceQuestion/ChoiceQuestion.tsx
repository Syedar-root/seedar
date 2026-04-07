import React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { Input } from '@base-ui/react/input';
import type { ChoiceQuestionProps } from './types';
import styles from './ChoiceQuestion.module.scss';

const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  options,
  value,
  otherInput,
  onChange,
  onOtherInputChange,
}) => {
  const hasOtherSelected = value.some((v) => {
    const option = options.find((opt) => opt.value === v);
    return option?.isOther;
  });

  const handleCheckboxChange = (checkedValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, checkedValue]);
    } else {
      onChange(value.filter((v) => v !== checkedValue));
    }
  };

  return (
    <div>
      <div className={styles['question-title']}>
        {question}
      </div>
      <div className={styles['options-list']}>
        {options.map((option, index) => (
          <label key={index} className={styles['option-item']}>
            <Checkbox.Root
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleCheckboxChange(option.value, checked)}
              className={styles['checkbox-root']}
            >
              <Checkbox.Indicator className={styles['checkbox-indicator']} />
            </Checkbox.Root>
            <span className={styles['option-label']}>
              {option.label}
            </span>
            {option.description && (
              <div className={styles['option-description']}>
                {option.description}
              </div>
            )}
          </label>
        ))}
      </div>
      {hasOtherSelected && (
        <div className={styles['other-input']}>
          <Input
            value={otherInput}
            onValueChange={(val) => onOtherInputChange(val)}
            placeholder="请输入其他内容..."
            className={styles['other-input-field']}
          />
        </div>
      )}
    </div>
  );
};

export default ChoiceQuestion;
