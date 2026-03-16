import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './gridPanel.module.css';

export interface GridPanelProps {
  panelId: string | number;
  key: string | number;
  children: React.ReactNode;
  content?: React.ReactNode;
  title?: React.ReactNode;
  showHeader?: boolean;
  headerExtra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

// 阻止事件冒泡的函数
const handleMouseEvents = (e: React.MouseEvent) => {
  e.stopPropagation();
};

export const GridPanel = forwardRef<HTMLDivElement, GridPanelProps>(
  (
    {
      panelId,
      key,
      children,
      content,
      title,
      showHeader = true,
      headerExtra,
      className = '',
      style = {},
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        key={key}
        className={clsx(styles['grid-panel'], className)}
        style={style}
        {...rest}
      >
        {showHeader && (
          <div className={styles['grid-panel-header']}>
            {title}
            {headerExtra}
          </div>
        )}
        {content && (
          <div
            className={styles['grid-panel-content']}
            onMouseDown={handleMouseEvents}
            onMouseMove={handleMouseEvents}
            onMouseUp={handleMouseEvents}
            onMouseEnter={handleMouseEvents}
            onMouseLeave={handleMouseEvents}
          >
            {content}
          </div>
        )}
        <div className={styles['grid-panel-footer']}>{children}</div>
      </div>
    );
  }
);
