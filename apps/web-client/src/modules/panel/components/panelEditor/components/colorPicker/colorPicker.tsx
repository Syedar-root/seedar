import { useState, useEffect } from 'react';
import styles from './colorPicker.module.scss';

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ colors, onChange }) => {
  const [inputValue, setInputValue] = useState(colors.join(', '));

  useEffect(() => {
    setInputValue(colors.join(', '));
  }, [colors]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const newColors = value
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c);
    onChange(newColors);
  };

  return (
    <div className={styles.colorPicker}>
      <div className={styles.title}>颜色配置</div>
      <div className={styles.preview}>
        {colors.slice(0, 8).map((color, index) => (
          <div
            key={index}
            className={styles.colorBlock}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <input
        className={styles.input}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="输入颜色值，逗号分隔"
      />
    </div>
  );
};
