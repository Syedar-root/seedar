import { clsx } from 'clsx';
import { useDrag } from 'react-dnd';

interface DragItemProps {
  className?: string;
  children: React.ReactNode;
  dragId: string | number;
  dragingOpacity?: number;
  itemType: string;
}

export const DragItem: React.FC<DragItemProps> = ({
  children,
  dragId,
  dragingOpacity = 0.5,
  itemType,
  className,
}: DragItemProps) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    // 拖拽类型（和放置区匹配）
    type: itemType,
    // 拖拽时传递的数据（放置区可接收）
    item: { id: dragId },
    // 收集拖拽状态：isDragging = 是否正在拖拽
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  return (
    <div
      className={className}
      ref={dragRef}
      style={{ opacity: isDragging ? dragingOpacity : 1 }}
    >
      {children}
    </div>
  );
};
