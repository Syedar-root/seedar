import React from 'react';

interface ChartContainerProps {
  width?: number | string;
  height?: number | string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  width = '100%',
  height = 400,
  children,
}) => {
  return (
    <div style={{ width, height, position: 'relative' }}>
      {children}
    </div>
  );
};
