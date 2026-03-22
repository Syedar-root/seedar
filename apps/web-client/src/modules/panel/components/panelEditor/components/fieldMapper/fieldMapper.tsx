import { PanelEditorConfig, ChartFieldConfig, FIELD_LABELS } from "../../types";
import type { DragItem } from "../../../dndHelper/dragZone/dragZone";
import { Select } from "@base-ui/react/select";
import styles from "./fieldMapper.module.scss";
import { ChevronsUpDown } from "lucide-react";

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
    const currentValue = config[fieldKey as keyof PanelEditorConfig] as
      | string
      | undefined;

    return (
      <div key={fieldKey} className={styles.fieldItem}>
        <Select.Root
          value={currentValue || null}
          onValueChange={(value) =>
            onChange({ [fieldKey]: value || undefined })
          }
        >
          <Select.Label className={styles.label}>
            {FIELD_LABELS[fieldKey]}
            {isRequired && <span className={styles.required}>*</span>}
          </Select.Label>
          <Select.Trigger className={styles.trigger}>
            <Select.Value placeholder="请选择" />
            <Select.Icon className={styles.icon}>
              <ChevronsUpDown />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={styles.positioner}>
              <Select.Popup className={styles.popup}>
                <Select.List className={styles.list}>
                  <Select.Group>
                    <Select.GroupLabel className={styles.groupLabel}>
                      维度
                    </Select.GroupLabel>
                    {fields.map((item) => (
                      <Select.Item
                        key={item.id}
                        value={item.businessName || item.name}
                        className={styles.item}
                      >
                        <Select.ItemText>
                          {item.businessName || item.name}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                  <Select.Group>
                    <Select.GroupLabel className={styles.groupLabel}>
                      指标
                    </Select.GroupLabel>
                    {metrics.map((item) => (
                      <Select.Item
                        key={item.id}
                        value={item.businessName || item.name}
                        className={styles.item}
                      >
                        <Select.ItemText>
                          {item.businessName || item.name}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
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
