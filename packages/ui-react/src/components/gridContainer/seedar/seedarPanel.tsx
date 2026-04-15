import { forwardRef, useMemo } from "react";
import { GridPanel, GridPanelProps } from "../gridPanel/gridPanel";
import { Chart } from "../../charts";
import { ListTable } from "../../table";
import { MetricCard } from "../../card";
import { Title } from "./components/title";
import { ExecuteQueryResponse, PanelResponse } from "#pkg/seedar/types";
import { usePanel } from "../../../hooks";
import { ISpec } from "@visactor/vchart";

export interface SeedarPanelProps extends Omit<GridPanelProps, "headerExtra"> {
  panelId: string;
  panel?: PanelResponse;
  className?: string;
  style?: React.CSSProperties;
  headerExtra?: (panelId: string) => React.ReactNode;
  data?: ExecuteQueryResponse;
}

export const SeedarPanel = forwardRef<HTMLDivElement, SeedarPanelProps>(
  (
    { panelId, panel, className = "", style = {}, headerExtra, data, ...rest },
    ref,
  ) => {
    // 只有当 panel 为 undefined 时才发起请求
    const { data: panelData, isPending, isError } = usePanel(panelId, !panel);

    // 只有当 panel 为 undefined 时才使用请求的数据
    const finalPanel = panel || panelData;

    const content = useMemo(() => {
      if (!finalPanel) return null;
      const { type: panelType, queryId, config } = finalPanel;
      if (panelType === "chart" && config) {
        return <Chart spec={config as ISpec} queryId={queryId} data={data} />;
      }
      if (panelType === "table") {
        return (
          <ListTable
            queryId={queryId}
            data={data}
            formatting={(config as { formatting?: any })?.formatting}
          />
        );
      }
      if (panelType === "card") {
        return (
          <MetricCard
            queryId={queryId}
            data={data}
            formatting={(config as { formatting?: any })?.formatting}
          />
        );
      }
      if (panelType === "text") {
        return <div>{config?.content}</div>;
      }
    }, [finalPanel, data]);

    if (!finalPanel && isPending) {
      //TODO: 加载中状态展示
      return null;
    } else if (isError) {
      //TODO: 错误状态展示
      return null;
    } else if (!finalPanel) {
      //TODO: 空状态展示
      return null;
    }
    const { title, titleConfig } = finalPanel;

    return (
      <GridPanel
        panelId={panelId}
        title={<Title {...titleConfig} content={title} />}
        ref={ref}
        content={content}
        className={className}
        style={style}
        headerExtra={headerExtra?.(panelId)}
        {...rest}
      />
    );
  },
);
