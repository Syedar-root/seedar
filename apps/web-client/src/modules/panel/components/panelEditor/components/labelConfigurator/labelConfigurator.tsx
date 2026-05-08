import { Check } from "lucide-react";
import { Checkbox } from "@base-ui/react/checkbox";
import {
  Combobox,
  type ComboboxOptionGroup,
} from "@/core/components/ui/Combobox";
import type {
  ChartType,
  LabelConfig,
  LabelSourceField,
} from "../../types";
import {
  CHART_FIELD_CONFIGS,
  FIELD_LABELS,
  LABEL_SOURCE_FIELD_LABELS,
} from "../../types";
import styles from "./labelConfigurator.module.scss";

interface LabelConfiguratorProps {
  chartType?: ChartType;
  config: LabelConfig;
  onChange: (config: LabelConfig) => void;
}

const buildLabelSourceOptions = (
  chartType?: ChartType,
): ComboboxOptionGroup[] => {
  const fieldConfig = chartType ? CHART_FIELD_CONFIGS[chartType] : undefined;
  const availableFields = fieldConfig
    ? [...fieldConfig.required, ...fieldConfig.optional]
    : [];

  const options = [
    {
      label: LABEL_SOURCE_FIELD_LABELS.auto,
      value: "auto",
    },
    ...availableFields.map((fieldKey) => ({
      label: FIELD_LABELS[fieldKey] || LABEL_SOURCE_FIELD_LABELS[fieldKey as LabelSourceField],
      value: fieldKey,
    })),
  ];

  return [
    {
      label: "标签来源",
      options,
    },
  ];
};

export const LabelConfigurator: React.FC<LabelConfiguratorProps> = ({
  chartType,
  config,
  onChange,
}) => {
  const handleVisibleChange = (visible: boolean) => {
    onChange({
      ...config,
      visible,
      sourceField: config.sourceField || "auto",
    });
  };

  const handleSourceFieldChange = (sourceField: string | null) => {
    onChange({
      ...config,
      sourceField: (sourceField as LabelSourceField | null) || "auto",
    });
  };

  const labelSourceOptions = buildLabelSourceOptions(chartType);

  return (
    <div className={styles.labelConfigurator}>
      <div className={styles.title}>标签配置</div>
      <div className={styles.row}>
        <label className={styles.label}>显示标签</label>
        <Checkbox.Root
          checked={config.visible}
          onCheckedChange={handleVisibleChange}
          className={styles.checkbox}
        >
          <Checkbox.Indicator className={styles.checkboxIndicator}>
            <Check size={14} />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </div>

      {config.visible && (
        <div className={styles.fieldItem}>
          <label className={styles.label}>标签内容</label>
          <Combobox
            value={config.sourceField || "auto"}
            onChange={handleSourceFieldChange}
            options={labelSourceOptions}
            placeholder="请选择标签来源"
            searchPlaceholder="搜索标签来源"
            emptyText="没有可选的标签来源"
            clearable={false}
          />
        </div>
      )}
    </div>
  );
};
