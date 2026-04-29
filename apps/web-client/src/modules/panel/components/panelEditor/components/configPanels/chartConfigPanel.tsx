import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { FieldMapper } from "../fieldMapper/fieldMapper";
import { LabelConfigurator } from "../labelConfigurator/labelConfigurator";
import { LegendConfigurator } from "../legendConfigurator/legendConfigurator";
import { ColorPicker } from "../colorPicker/colorPicker";
import { AxisConfigurator } from "../axisConfigurator/axisConfigurator";
import {
  SUPPORTED_CHART_SPEC_TYPES,
  buildChartSpecFromEditorConfig,
} from "../../chartSpec";
import {
  CARTESIAN_CHART_TYPES,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  createDefaultAxisConfig,
  type ChartType,
  type ConfigPanelProps,
  type PanelEditorConfig,
} from "../../types";
import styles from "./chartConfigPanel.module.scss";

const COPY = {
  visualMode: "可视化配置",
  advancedMode: "高级 Spec",
  advancedHint: "高级模式会直接使用你输入的 Spec JSON。",
  advancedSubHint: "formatting 由格式化面板维护，不在此处展示或编辑。",
  supportedTypesLabel: "内置映射 type",
  generateFromVisual: "从可视化生成",
  formatJson: "格式化",
  validateJson: "校验",
  applyToPreview: "应用到预览",
  availableFields: "可用字段",
  expandEditor: "放大编辑",
  expandedTitle: "高级 Spec 编辑器",
  expandedClose: "关闭",
  jsonPlaceholder: `{
  "type": "bar",
  "xField": "date",
  "yField": "sales"
}`,
  invalidJson: "JSON 格式不正确，请检查后重试",
  invalidRoot: "Spec 必须是 JSON 对象",
  customTypeHint:
    "检测到自定义 type，将按原始 Spec 预览，字段需你自行确认。",
  validatePassed: "Spec JSON 校验通过",
  applySuccess: "Spec 已应用到预览",
  typeMismatch: "Spec.type 与当前图表类型不一致，已按 Spec.type 预览",
  missingChartType: "请先选择图表类型",
} as const;

const VCHART_SPEC_DOC_URL =
  "https://visactor.io/vchart/guide/tutorial_docs/Basic/A_Basic_Spec";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stripFormattingFromSpec = (spec: Record<string, unknown>) => {
  const nextSpec = { ...spec };
  delete nextSpec.formatting;
  return nextSpec;
};

const formatSpecJson = (spec: Record<string, unknown>) =>
  JSON.stringify(stripFormattingFromSpec(spec), null, 2);

const createVisualSnapshot = (
  config: PanelEditorConfig,
): Partial<PanelEditorConfig> => {
  const {
    type,
    xField,
    yField,
    seriesField,
    categoryField,
    valueField,
    sizeField,
    smooth,
    direction,
    color,
    label,
    legends,
    axis,
  } = config;

  return {
    type,
    xField,
    yField,
    seriesField,
    categoryField,
    valueField,
    sizeField,
    smooth,
    direction,
    color,
    label,
    legends,
    axis,
  };
};

const buildActionToastMessage = (
  baseMessage: string,
  options: {
    normalizedType: string;
    currentChartType?: ChartType;
  },
) => {
  const notes: string[] = [];

  if (!SUPPORTED_CHART_SPEC_TYPES.includes(options.normalizedType as ChartType)) {
    notes.push(COPY.customTypeHint);
  }

  if (
    options.currentChartType &&
    options.normalizedType !== options.currentChartType
  ) {
    notes.push(COPY.typeMismatch);
  }

  if (notes.length === 0) {
    return baseMessage;
  }

  return `${baseMessage} ${notes.join(" ")}`;
};

export const ChartConfigPanel: React.FC<ConfigPanelProps> = ({
  fields,
  metrics,
  config,
  onChange,
}) => {
  const [specDraft, setSpecDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isExpandedEditorOpen, setIsExpandedEditorOpen] = useState(false);
  const visualSnapshotRef = useRef<Partial<PanelEditorConfig> | null>(null);
  const chartType = config.type as ChartType;
  const fieldConfig = chartType ? CHART_FIELD_CONFIGS[chartType] : null;
  const showAxisConfigurator = chartType
    ? CARTESIAN_CHART_TYPES.includes(chartType)
    : false;
  const isAdvancedMode = Boolean(config.isAdvancedSpecMode);
  const supportedTypeText = SUPPORTED_CHART_SPEC_TYPES.join(", ");

  const availableFields = useMemo(
    () =>
      Array.from(
        new Set(
          [...fields, ...metrics]
            .map((item) => item.businessName || item.name)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [fields, metrics],
  );

  const visualSpec = useMemo(() => {
    if (!chartType) {
      return undefined;
    }

    const spec = buildChartSpecFromEditorConfig(chartType, {
      ...config,
      isAdvancedSpecMode: false,
    });
    return spec ? stripFormattingFromSpec(spec) : undefined;
  }, [chartType, config]);

  useEffect(() => {
    if (!isAdvancedMode) {
      return;
    }

    if (isRecord(config.advancedSpec)) {
      const nextDraft = formatSpecJson(
        stripFormattingFromSpec(config.advancedSpec),
      );
      setSpecDraft((currentDraft) =>
        currentDraft === nextDraft ? currentDraft : nextDraft,
      );
      return;
    }

    if (visualSpec) {
      const visualDraft = formatSpecJson(visualSpec);
      setSpecDraft((currentDraft) =>
        currentDraft.trim() ? currentDraft : visualDraft,
      );
    }
  }, [config.advancedSpec, isAdvancedMode, visualSpec]);

  const parseDraftSpec = () => {
    try {
      const parsed = JSON.parse(specDraft) as unknown;
      if (!isRecord(parsed)) {
        setErrorMessage(COPY.invalidRoot);
        toast.error(COPY.invalidRoot);
        return undefined;
      }

      setErrorMessage("");
      return parsed;
    } catch {
      setErrorMessage(COPY.invalidJson);
      toast.error(COPY.invalidJson);
      return undefined;
    }
  };

  const normalizeParsedSpec = (parsed: Record<string, unknown>) => {
    const nextSpec = stripFormattingFromSpec(parsed);

    if (!nextSpec.type && chartType) {
      nextSpec.type = chartType;
    }

    if (typeof nextSpec.type !== "string" || !nextSpec.type.trim()) {
      setErrorMessage(COPY.missingChartType);
      toast.error(COPY.missingChartType);
      return undefined;
    }

    setErrorMessage("");
    return nextSpec;
  };

  const handleEnterAdvancedMode = () => {
    if (isAdvancedMode) {
      return;
    }

    if (!chartType) {
      toast.error(COPY.missingChartType);
      return;
    }

    visualSnapshotRef.current = createVisualSnapshot(config);

    if (isRecord(config.advancedSpec)) {
      setSpecDraft(formatSpecJson(stripFormattingFromSpec(config.advancedSpec)));
    } else if (visualSpec) {
      setSpecDraft(formatSpecJson(visualSpec));
    }

    setErrorMessage("");
    onChange({ isAdvancedSpecMode: true });
  };

  const handleExitAdvancedMode = () => {
    if (!isAdvancedMode) {
      return;
    }

    setErrorMessage("");
    onChange({
      ...(visualSnapshotRef.current ?? {}),
      isAdvancedSpecMode: false,
    });
  };

  const handleValidate = () => {
    const parsed = parseDraftSpec();
    if (!parsed) {
      return;
    }

    const normalizedSpec = normalizeParsedSpec(parsed);
    if (!normalizedSpec) {
      return;
    }

    toast.success(
      buildActionToastMessage(COPY.validatePassed, {
        normalizedType: normalizedSpec.type as string,
        currentChartType: chartType,
      }),
    );
  };

  const handleFormatJson = () => {
    const parsed = parseDraftSpec();
    if (!parsed) {
      return;
    }

    const normalizedSpec = normalizeParsedSpec(parsed);
    if (!normalizedSpec) {
      return;
    }

    setSpecDraft(formatSpecJson(normalizedSpec));
  };

  const handleApply = () => {
    const parsed = parseDraftSpec();
    if (!parsed) {
      return;
    }

    const normalizedSpec = normalizeParsedSpec(parsed);
    if (!normalizedSpec) {
      return;
    }

    setSpecDraft(formatSpecJson(normalizedSpec));
    onChange({
      isAdvancedSpecMode: true,
      advancedSpec: normalizedSpec,
    });
    toast.success(
      buildActionToastMessage(COPY.applySuccess, {
        normalizedType: normalizedSpec.type as string,
        currentChartType: chartType,
      }),
    );
  };

  const handleGenerateFromVisual = () => {
    if (!visualSpec) {
      toast.error(COPY.missingChartType);
      return;
    }

    setSpecDraft(formatSpecJson(visualSpec));
    setErrorMessage("");
  };

  const renderAdvancedActions = (showExpandAction = true) => (
    <div className={styles.actions}>
      <div className={styles.secondaryActions}>
        {showExpandAction ? (
          <button
            type="button"
            className={styles.iconAction}
            onClick={() => setIsExpandedEditorOpen(true)}
            title={COPY.expandEditor}
            aria-label={COPY.expandEditor}
          >
            <Maximize2 size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className={styles.action}
          onClick={handleGenerateFromVisual}
        >
          {COPY.generateFromVisual}
        </button>
        <button type="button" className={styles.action} onClick={handleFormatJson}>
          {COPY.formatJson}
        </button>
        <button type="button" className={styles.action} onClick={handleValidate}>
          {COPY.validateJson}
        </button>
      </div>
      <div className={styles.primaryActions}>
        <button
          type="button"
          className={`${styles.action} ${styles.primaryAction}`}
          onClick={handleApply}
        >
          {COPY.applyToPreview}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.modeSwitcher}>
        <button
          type="button"
          className={`${styles.modeButton} ${!isAdvancedMode ? styles.modeButtonActive : ""}`}
          onClick={handleExitAdvancedMode}
        >
          {COPY.visualMode}
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${isAdvancedMode ? styles.modeButtonActive : ""}`}
          onClick={handleEnterAdvancedMode}
        >
          {COPY.advancedMode}
        </button>
      </div>

      {isAdvancedMode ? (
        <section className={styles.advancedMode}>
          <div className={styles.toolbar}>
            <div className={styles.meta}>
              <p className={styles.hint}>{COPY.advancedHint}</p>
              <p className={styles.subHint}>{COPY.advancedSubHint}</p>
              <p className={styles.docHint}>
                <span>Spec 配置可参考</span>
                <a
                  className={styles.docLink}
                  href={VCHART_SPEC_DOC_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  VisActor VChart 官方文档
                </a>
              </p>
              <p className={styles.supportedTypes}>
                <span>{COPY.supportedTypesLabel}：</span>
                <code>{supportedTypeText}</code>
              </p>
            </div>
            {renderAdvancedActions()}
          </div>

          <textarea
            className={styles.editor}
            value={specDraft}
            onChange={(event) => {
              setSpecDraft(event.target.value);
              setErrorMessage("");
            }}
            placeholder={COPY.jsonPlaceholder}
            spellCheck={false}
          />

          {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

          <div className={styles.fieldTips}>
            <span className={styles.fieldTipsTitle}>{COPY.availableFields}</span>
            <div className={styles.fieldList}>
              {availableFields.map((field) => (
                <code key={field} className={styles.fieldItem}>
                  {field}
                </code>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          {fieldConfig && (
            <FieldMapper
              fields={fields}
              metrics={metrics}
              config={config}
              fieldConfig={fieldConfig}
              onChange={onChange}
            />
          )}
          <LabelConfigurator
            config={config.label || { visible: false }}
            onChange={(label) => onChange({ label })}
          />
          <LegendConfigurator
            config={config.legends || DEFAULT_LEGENDS_CONFIG}
            onChange={(legends) => onChange({ legends })}
          />
          {showAxisConfigurator && (
            <AxisConfigurator
              config={config.axis || createDefaultAxisConfig()}
              onChange={(axis) => onChange({ axis })}
            />
          )}
          <ColorPicker
            colors={config.color || DEFAULT_COLORS}
            onChange={(colors) => onChange({ color: colors })}
          />
        </>
      )}

      <Dialog.Root
        open={isExpandedEditorOpen}
        onOpenChange={setIsExpandedEditorOpen}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.dialogBackdrop} />
          <Dialog.Popup className={styles.dialogPopup}>
            <div className={styles.dialogContent}>
              <div className={styles.dialogHeader}>
                <Dialog.Title className={styles.dialogTitle}>
                  {COPY.expandedTitle}
                </Dialog.Title>
                <button
                  type="button"
                  className={styles.dialogClose}
                  onClick={() => setIsExpandedEditorOpen(false)}
                >
                  {COPY.expandedClose}
                </button>
              </div>

              <div className={styles.dialogToolbar}>
                {renderAdvancedActions(false)}
              </div>

              <ScrollArea
                style={{ flex: 1, minHeight: 0 }}
                contentStyle={{ minWidth: 0 }}
              >
                <div className={styles.dialogEditorWrap}>
                  <textarea
                    className={`${styles.editor} ${styles.dialogEditor}`}
                    value={specDraft}
                    onChange={(event) => {
                      setSpecDraft(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder={COPY.jsonPlaceholder}
                    spellCheck={false}
                  />
                </div>
              </ScrollArea>

              {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
