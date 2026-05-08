import { useMemo } from "react";
import { Tour } from "antd";
import type { AppTourProps, AppTourStep } from "./types";
import styles from "./AppTour.module.scss";

const TOUR_BUTTON_COPY = {
  previous: "上一步",
  next: "下一步",
  finish: "完成",
} as const;

export const AppTour = ({ steps, ...tourProps }: AppTourProps) => {
  const renderStepIndicator = (current: number, total: number) => {
    return `${current + 1}/${total}`;
  };

  const classNames = useMemo(
    () => ({
      root: styles.root,
      section: styles.section,
      footer: styles.footer,
      actions: styles.actions,
      indicators: styles.indicators,
      indicator: styles.indicator,
      header: styles.header,
      title: styles.title,
      description: styles.description,
    }),
    [],
  );

  const resolvedSteps = useMemo(
    () =>
      steps.map((step, index) => {
        const isLastStep = index === steps.length - 1;
        const baseStep = {
          ...step,
          prevButtonProps: {
            ...step.prevButtonProps,
            children: TOUR_BUTTON_COPY.previous,
          },
          nextButtonProps: {
            ...step.nextButtonProps,
            children: isLastStep ? TOUR_BUTTON_COPY.finish : TOUR_BUTTON_COPY.next,
          },
        };

        if (step.target || !step.selector) {
          return baseStep;
        }

        const selector = step.selector;
        const target = (() => {
          const node = document.querySelector(selector);
          return node instanceof HTMLElement ? node : null;
        }) as AppTourStep["target"];
        return {
          ...baseStep,
          target,
        };
      }),
    [steps],
  );

  return (
    <Tour
      indicatorsRender={renderStepIndicator}
      classNames={classNames}
      {...tourProps}
      steps={resolvedSteps}
    />
  );
};

export default AppTour;
