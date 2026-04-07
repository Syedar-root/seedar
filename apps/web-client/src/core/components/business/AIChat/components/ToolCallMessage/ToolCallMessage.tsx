import React from 'react';
import { Wrench } from 'lucide-react';
import type { ToolCallMessageProps } from './types';
import styles from './ToolCallMessage.module.scss';

const ToolCallMessage: React.FC<ToolCallMessageProps> = ({ meta }) => {
  const toolName = meta?.name || '未知工具';
  return (
    <div className={styles['container']}>
      <Wrench size={16} color="var(--chat-color-muted)" className={styles['icon']} />
      <span className={styles['label']}>
        {toolName}
      </span>
    </div>
  );
};

export default ToolCallMessage;