import { useMemo } from "react";
import { Tour } from "antd";
import type { AppTourProps, AppTourStep } from "./types";
import styles from "./AppTour.module.scss";

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
      steps.map((step) => {
        if (step.target || !step.selector) {
          return step;
        }

        const selector = step.selector;
        const target = (() => {
          const node = document.querySelector(selector);
          return node instanceof HTMLElement ? node : null;
        }) as AppTourStep["target"];
        return {
          ...step,
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
