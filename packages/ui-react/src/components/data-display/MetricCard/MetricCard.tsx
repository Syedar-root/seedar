import type { ComponentType } from "react";

import { DefaultCard, LineChartCard, ProgressCard } from "./components";
import { useMetricCardData } from "./hooks/useMetricCardData.hook";
import { cardRegistry } from "./utils";
import type {
  MetricCardProps,
  MetricCardResolvedProps,
} from "./types";

cardRegistry.registerDefault("default", {
  component: DefaultCard as ComponentType<MetricCardResolvedProps>,
});
cardRegistry.register("withLineChart", {
  component: LineChartCard as ComponentType<MetricCardResolvedProps>,
});
cardRegistry.register("withProgress", {
  component: ProgressCard as ComponentType<MetricCardResolvedProps>,
});

export const MetricCard: React.FC<MetricCardProps> = (props) => {
  const resolvedProps = useMetricCardData(props);

  if (!resolvedProps) {
    return null;
  }

  const config = cardRegistry.get(resolvedProps.variant ?? "default");
  if (!config) {
    return null;
  }

  const CardComponent = config.component;

  return <CardComponent {...config.defaultProps} {...resolvedProps} />;
};

export const registerCardType = (
  type: string,
  component: ComponentType<MetricCardResolvedProps>,
  defaultProps?: Partial<MetricCardResolvedProps>,
) => {
  cardRegistry.register(type, {
    component,
    defaultProps,
  });
};

export const getRegisteredCardTypes = () => {
  return cardRegistry.getAllTypes();
};
