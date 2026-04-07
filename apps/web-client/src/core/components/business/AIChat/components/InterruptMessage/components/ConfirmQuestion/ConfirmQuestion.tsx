import React from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import type { ConfirmQuestionProps } from './types';
import styles from './ConfirmQuestion.module.scss';

const ConfirmQuestion: React.FC<ConfirmQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  return (
    <div>
      <div className={styles['question-title']}>
        {question}
      </div>
      <RadioGroup value={value} onValueChange={(val) => onChange(val)} className={styles['radio-group']}>
        <label className={styles['radio-label']}>
          <Radio.Root value="yes" className={styles['radio-root']}>
            <Radio.Indicator className={styles['radio-indicator']} />
          </Radio.Root>
          <span className={styles['radio-text']}>是</span>
        </label>
        <label className={styles['radio-label']}>
          <Radio.Root value="no" className={styles['radio-root']}>
            <Radio.Indicator className={styles['radio-indicator']} />
          </Radio.Root>
          <span className={styles['radio-text']}>否</span>
        </label>
      </RadioGroup>
    </div>
  );
};

export default ConfirmQuestion;
