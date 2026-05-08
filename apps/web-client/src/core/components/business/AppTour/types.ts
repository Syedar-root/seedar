import type { TourProps } from "antd";

export type AppTourBaseStep = NonNullable<TourProps["steps"]>[number];

export interface AppTourStep extends Omit<AppTourBaseStep, "target"> {
  target?: AppTourBaseStep["target"];
  selector?: string;
}

export interface AppTourProps extends Omit<TourProps, "steps"> {
  steps: AppTourStep[];
}
