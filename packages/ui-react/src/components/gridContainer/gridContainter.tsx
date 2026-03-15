import {
  getCompactor,
  noCompactor,
  Responsive,
  useContainerWidth,
} from 'react-grid-layout';
import { GridPanel } from './gridPanel/gridPanel';
import { SeedarPanel } from './gridPanel/seedarPanel';

const COLS_RATE = 2;
const COLS = {
  lg: 12 * COLS_RATE,
  md: 10 * COLS_RATE,
  sm: 6 * COLS_RATE,
  xs: 4 * COLS_RATE,
  xxs: 2 * COLS_RATE,
};
const MARGIN = 10;

export const GridContainer: React.FC = () => {
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

  const layouts = {
    lg: [
      { i: '1', x: 0, y: 0, w: 9, h: 7, minW: 2, minH: 2 },
      { i: '2', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
      { i: '3', x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    ],
    md: [
      { i: '1', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
      { i: '2', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
      { i: '3', x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    ],
  };

  const myCompactor = {
    ...noCompactor,
    preventCollision: true, // 核心：阻止元素重叠
  };

  return (
    containerRef && (
      <div ref={containerRef as React.RefObject<HTMLDivElement>}>
        {mounted && (
          <Responsive
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={COLS}
            margin={[MARGIN, MARGIN]}
            rowHeight={rowHeight}
            width={width}
            compactor={myCompactor}
          >
            <SeedarPanel panelId="1" key="1" />
          </Responsive>
        )}
      </div>
    )
  );
};
