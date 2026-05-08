import { useEffect, useState } from "react";
import { Tour } from "antd";
import type { AppTourProps } from "./types";

export const AppTour = ({ steps, ...tourProps }: AppTourProps) => {
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    setIsDomReady(true);
  }, []);

  const resolvedSteps = steps.map((step) => {
    if (step.target || !step.selector) {
      return step;
    }

    if (!isDomReady) {
      return step;
    }

    const selector = step.selector;
    const node = document.querySelector(selector);

    if (!(node instanceof HTMLElement)) {
      return step;
    }

    return { ...step, target: node };
  });

  return <Tour {...tourProps} steps={resolvedSteps} />;
};

export default AppTour;
