import { PanelEditorConfig, ChartFieldConfig, FIELD_LABELS } from '../../types';
import type { DragItem } from '../../../dndHelper/dragZone/dragZone';
import styles from './fieldMapper.module.scss';

interface FieldMapperProps {
  fields: DragItem[];
  metrics: DragItem[];
  config: PanelEditorConfig;
  fieldConfig: ChartFieldConfig;
  onChange: (config: Partial<PanelEditorConfig>) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  fields,
  metrics,
  config,
  fieldConfig,
  onChange,
}) => {
  const allOptions = [...fields, ...metrics];

  const renderSelect = (fieldKey: string, isRequired: boolean) => {
    const currentValue = config[fieldKey as keyof PanelEditorConfig] as string | undefined;

    return (
      <div key={fieldKey} className={styles.fieldItem}>
        <label className={styles.label}>
          {FIELD_LABELS[fieldKey]}
          {isRequired && <span className={styles.required}>*</span>}
        </label>
        <select
          className={styles.select}
          value={currentValue || ''}
          onChange={(e) => onChange({ [fieldKey]: e.target.value || undefined })}
        >
          <option value="">请选择</option>
          <optgroup label="维度">
            {fields.map((item) => (
              <option key={item.id} value={item.businessName || item.name}>
                {item.businessName || item.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="指标">
            {metrics.map((item) => (
              <option key={item.id} value={item.businessName || item.name}>
                {item.businessName || item.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  };

  return (
    <div className={styles.fieldMapper}>
      <div className={styles.title}>字段映射</div>
      <div className={styles.fields}>
        {fieldConfig.required.map((field) => renderSelect(field, true))}
        {fieldConfig.optional.map((field) => renderSelect(field, false))}
      </div>
    </div>
  );
};
