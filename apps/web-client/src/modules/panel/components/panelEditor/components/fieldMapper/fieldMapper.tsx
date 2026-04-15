import { PanelEditorConfig, ChartFieldConfig, FIELD_LABELS } from "../../types";
import type { DragItem } from "../../../dndHelper/dragZone/dragZone";
import styles from "./fieldMapper.module.scss";
import {
  Combobox,
  type ComboboxOptionGroup,
} from "../../../../../../core/components/ui/Combobox";

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
  const fieldOptions: ComboboxOptionGroup[] = [
    {
      label: "维度",
      options: fields.map((item) => ({
        label: item.businessName || item.name,
        value: item.businessName || item.name,
      })),
    },
    {
      label: "指标",
      options: metrics.map((item) => ({
        label: item.businessName || item.name,
        value: item.businessName || item.name,
      })),
    },
  ];

  const renderSelect = (fieldKey: string, isRequired: boolean) => {
    const currentValue = config[fieldKey as keyof PanelEditorConfig] as
      | string
      | undefined;

    return (
      <div key={fieldKey} className={styles.fieldItem}>
        <label className={styles.label}>
          {FIELD_LABELS[fieldKey]}
          {isRequired && <span className={styles.required}>*</span>}
        </label>
        <Combobox
          value={currentValue || null}
          onChange={(value) => onChange({ [fieldKey]: value || undefined })}
          options={fieldOptions}
          placeholder="请选择字段/指标"
          searchPlaceholder="搜索字段/指标"
          emptyText="没有匹配的字段/指标"
        />
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
