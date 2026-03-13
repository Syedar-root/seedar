import { forwardRef, useMemo } from 'react';
import { GridPanel } from './gridPanel';
import { Chart } from '../../charts';
import { ListTable } from '../../table';
import { Title } from './components/title';

interface SeedarPanelProps {
  panelId: string | number;
  [key: string]: any;
}

interface SeedarPanel {
  panelId: string | number;
  panelType: 'chart' | 'listTable' | 'text';
  queryId?: string | number;
  titleConfig?: {
    content?: string;
    type: 'plain' | 'flag';
  };
}

const mockFetch = (panelId: string | number) => {
  const panelType = panelId.toString().startsWith('chart')
    ? 'chart'
    : 'listTable';
  return {
    panelType: panelType,
    queryId: 6,
    titleConfig: {
      content: '销售趋势图',
      type: 'flag' as const,
    },
  };
};

export const SeedarPanel = forwardRef<HTMLDivElement, SeedarPanelProps>(
  ({ panelId, ...rest }, ref) => {
    const { panelType, queryId, titleConfig } = mockFetch(panelId);
    const content = useMemo(() => {
      if (panelType === 'chart') {
        return <Chart queryId={queryId} />;
      }
      if (panelType === 'listTable') {
        return <ListTable queryId={queryId} />;
      }
      if (panelType === 'text') {
        return queryId;
      }
    }, [panelId]);

    return (
      <GridPanel
        panelId={panelId}
        title={<Title {...titleConfig} />}
        ref={ref}
        content={content}
        {...rest}
      />
    );
  }
);
