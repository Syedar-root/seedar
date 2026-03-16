import { forwardRef, useMemo } from 'react';
import { GridPanel, GridPanelProps } from '../gridPanel/gridPanel';
import { Chart } from '../../charts';
import { ListTable } from '../../table';
import { Title } from './components/title';
import { PanelResponse } from '#pkg/seedar/types';
import { usePanel } from '../../../hooks';
import { ISpec } from '@visactor/vchart';

export interface SeedarPanelProps extends GridPanelProps {
  panelId: string;
  panel?: PanelResponse;
  className?: string;
  style?: React.CSSProperties;
}

interface SeedarPanel {
  panelId: string | number;
  panelType: 'chart' | 'table' | 'text';
  queryId?: string;
  titleConfig?: {
    content?: string;
    type: 'plain' | 'flag';
  };
}

export const SeedarPanel = forwardRef<HTMLDivElement, SeedarPanelProps>(
  ({ panelId, panel, className = '', style = {}, ...rest }, ref) => {
    // 只有当 panel 为 undefined 时才发起请求
    const { data: panelData, isPending, isError } = usePanel(panelId, !panel);

    // 只有当 panel 为 undefined 时才使用请求的数据
    const finalPanel = panel || panelData;

    const content = useMemo(() => {
      if (!finalPanel) return null;
      const { type: panelType, queryId, config } = finalPanel;
      if (panelType === 'chart') {
        return <Chart spec={config as ISpec} queryId={queryId} />;
      }
      if (panelType === 'table') {
        return <ListTable queryId={queryId} />;
      }
      if (panelType === 'text') {
        return <div>{config?.content}</div>;
      }
    }, [finalPanel]);

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
    const { title } = finalPanel;

    return (
      <GridPanel
        panelId={panelId}
        title={<Title content={title} />}
        ref={ref}
        content={content}
        className={className}
        style={style}
        {...rest}
      />
    );
  }
);
