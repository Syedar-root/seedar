import { Check } from "lucide-react";
import type { StepStatus } from "../../../types/editor.types";
import styles from "./Timeline.module.scss";

interface Step {
  key: string;
  label: string;
  status: StepStatus;
}

interface TimelineProps {
  steps: Step[];
  currentStep: string;
  onStepClick: (key: string) => void;
}

export const Timeline = ({ steps, currentStep, onStepClick }: TimelineProps) => {
  return (
    <div className={styles.timeline}>
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed";
        const isActive = step.status === "active";
        const isPending = step.status === "pending";
        const isError = step.status === "error";

        return (
          <div
            key={step.key}
            className={`${styles.stepItem} ${isCompleted ? styles.completed : ""} ${
              isActive ? styles.active : ""
            } ${isPending ? styles.pending : ""} ${isError ? styles.error : ""}`}
          >
            <div className={styles.stepIndicator}>
              <div className={styles.indicatorCircle}>
                {isCompleted && <Check size={12} strokeWidth={3} />}
                {isActive && <div className={styles.activeDot} />}
                {isPending && <div className={styles.pendingDot} />}
                {isError && <div className={styles.errorDot} />}
              </div>
              {index < steps.length - 1 && <div className={styles.connector} />}
            </div>
            <div
              className={styles.stepContent}
              onClick={() => isCompleted && onStepClick(step.key)}
              role={isCompleted ? "button" : undefined}
              tabIndex={isCompleted ? 0 : undefined}
              onKeyDown={(e) => {
                if (isCompleted && (e.key === "Enter" || e.key === " ")) {
                  onStepClick(step.key);
                }
              }}
            >
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};