import { useState, useEffect } from "react";
import styles from "./colorPicker.module.scss";

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  onChange,
}) => {
  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    onChange(newColors);
  };

  const handleAddColor = () => {
    onChange([...colors, "#000000"]);
  };

  const handleRemoveColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    onChange(newColors);
  };

  return (
    <div className={styles.colorPicker}>
      <div className={styles.title}>颜色配置</div>
      <div className={styles.colorList}>
        {colors.map((color, index) => (
          <div key={index} className={styles.colorItem}>
            <div
              className={styles.colorBlock}
              style={{ backgroundColor: color }}
              onClick={() => {
                const input = document.getElementById(
                  `color-input-${index}`,
                ) as HTMLInputElement;
                input?.click();
              }}
            />
            <input
              id={`color-input-${index}`}
              type="color"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              className={styles.hiddenInput}
            />
            <span className={styles.colorValue}>{color}</span>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemoveColor(index)}
              title="删除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className={styles.addBtn} onClick={handleAddColor}>
        + 添加颜色
      </button>
    </div>
  );
};
