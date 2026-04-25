import React from "react";
import type { ProgressBarProps } from "./types";
import styles from "./ProgressBar.module.scss";

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  answeredIds,
  questionInfos,
  onJumpTo,
}) => {
  return (
    <div className={styles['container']}>
      {Array.from({ length: total }).map((_, index) => {
        const questionInfo = questionInfos[index];
        const questionId = questionInfo?.id;
        const isAnswered = questionId ? answeredIds.has(questionId) : false;
        const isCurrent = index + 1 === current;
        const canSkip = questionInfo?.canSkip ?? false;
        const isSkipped = canSkip && !isAnswered && !isCurrent;

        let stepClass = styles['step-default'];
        if (isCurrent) {
          stepClass = styles['step-current'];
        } else if (isAnswered) {
          stepClass = styles['step-answered'];
        } else if (isSkipped) {
          stepClass = styles['step-skipped'];
        }

        return (
          <React.Fragment key={index}>
            <div
              onClick={() => onJumpTo(index)}
              className={`${styles['step']} ${stepClass}`}
            />
          </React.Fragment>
        );
      })}
      <span className={styles['counter']}>
        {current}/{total}
      </span>
    </div>
  );
};

export default ProgressBar;