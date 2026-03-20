import React from 'react';
import { useDrop } from 'react-dnd';

export interface DragItem {
  id: string | number;
  [key: string]: any;
}
// 🔥 定义组件Props类型
interface DragZoneProps {
  // 放置成功的回调函数（TS严格约束参数）
  onDrop: (item: DragItem) => void;
  children: React.ReactNode;
  itemType: string;
  className?: string;
  style?: React.CSSProperties;
  overColor?: string;
}

export const DragZone: React.FC<DragZoneProps> = ({
  onDrop,
  children,
  itemType,
  className,
  style,
  overColor,
}) => {
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: itemType,
      drop: (item: DragItem) => {
        onDrop(item);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop],
  );

  return (
    <div
      ref={dropRef}
      className={className}
      style={{
        ...style,
        backgroundColor: isOver ? overColor : undefined,
      }}
    >
      {children}
    </div>
  );
};
