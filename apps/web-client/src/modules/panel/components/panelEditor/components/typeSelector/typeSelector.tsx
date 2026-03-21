import { DisplayPanelType } from '../../types';
import styles from './typeSelector.module.scss';
import clsx from 'clsx';

interface TypeSelectorProps {
  value: DisplayPanelType;
  onChange: (type: DisplayPanelType) => void;
}

const PANEL_TYPES: { type: DisplayPanelType; label: string }[] = [
  { type: 'table', label: '表格' },
  { type: 'card', label: '卡片' },
  { type: 'line', label: '折线图' },
  { type: 'bar', label: '柱状图' },
  { type: 'area', label: '面积图' },
  { type: 'pie', label: '饼图' },
  { type: 'scatter', label: '散点图' },
  { type: 'radar', label: '雷达图' },
];

export const TypeSelector: React.FC<TypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className={styles.typeSelector}>
      <div className={styles.title}>展示类型</div>
      <div className={styles.grid}>
        {PANEL_TYPES.map((item) => (
          <div
            key={item.type}
            className={clsx(styles.typeItem, value === item.type && styles.active)}
            onClick={() => onChange(item.type)}
          >
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
