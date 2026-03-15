import { noCompactor, Responsive, useContainerWidth } from 'react-grid-layout';
import { SeedarPanel } from './gridPanel/seedarPanel';
import { useDashboard } from '../../hooks';

interface SeedarDashboardProps {
  dashboardId: string;
}

const COLS_RATE = 2;
const COLS = {
  lg: 12 * COLS_RATE,
  md: 10 * COLS_RATE,
  sm: 6 * COLS_RATE,
  xs: 4 * COLS_RATE,
  xxs: 2 * COLS_RATE,
};
const MARGIN = 10;

export const SeedarDashboard: React.FC<SeedarDashboardProps> = ({
  dashboardId,
}) => {
  const { width, containerRef, mounted } = useContainerWidth();

  const currentCols =
    width >= 1200
      ? COLS.lg
      : width >= 996
      ? COLS.md
      : width >= 768
      ? COLS.sm
      : width >= 480
      ? COLS.xs
      : COLS.xxs;
  const rowHeight = (width - MARGIN * (currentCols - 1)) / currentCols;

  const { data: dashboardData, isPending, isError } = useDashboard(dashboardId);

  const myCompactor = {
    ...noCompactor,
    preventCollision: true, // 核心：阻止元素重叠
  };

  const canRender = mounted && !isPending && !isError && dashboardData;

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>}>
      {canRender && (
        <Responsive
          layouts={dashboardData.layout}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={COLS}
          margin={[MARGIN, MARGIN]}
          rowHeight={rowHeight}
          width={width}
          compactor={myCompactor}
        >
          {dashboardData.panels.map((panel) => (
            <SeedarPanel key={panel.id} panelId={panel.id} panel={panel} />
          ))}
        </Responsive>
      )}
    </div>
  );
};
