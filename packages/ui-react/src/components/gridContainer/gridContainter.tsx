import {
  getCompactor,
  noCompactor,
  Responsive,
  useContainerWidth,
} from 'react-grid-layout';
import type { Layouts } from '#pkg/seedar/types';

const COLS_RATE = 2;
const COLS = {
  lg: 12 * COLS_RATE,
  md: 10 * COLS_RATE,
  sm: 6 * COLS_RATE,
  xs: 4 * COLS_RATE,
  xxs: 2 * COLS_RATE,
};
const MARGIN = 10;

interface GridContainerProps {
  layouts: Layouts;
  children: React.ReactNode;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  layouts,
  children,
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

  const myCompactor = {
    ...noCompactor,
    preventCollision: true,
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
            {children}
          </Responsive>
        )}
      </div>
    )
  );
};
