import { useState, useCallback, useMemo, useEffect } from "react";
import { useDatasource } from "#pkg/seedar/ui-react";
import type {
  DatasetFormData,
  JoinConfig,
  MetricConfig,
  EditorSteps,
  EditorMode,
} from "../types/editor.types";

const STEPS: EditorSteps[] = [
  "basicInfo",
  "dataSource",
  "joinConfig",
  "fieldConfig",
  "metricConfig",
  "confirm",
];

const createEmptyFormData = (): DatasetFormData => ({
  name: "",
  description: "",
  type: "semantic",
  datasourceId: "",
  tables: [],
  mainTable: "",
  joins: [],
  fields: [],
  metrics: [],
});

interface UseDatasetFormProps {
  mode: EditorMode;
  initialData?: DatasetFormData;
  onSubmit?: (data: DatasetFormData) => void;
}

export const useDatasetForm = ({
  mode,
  initialData,
  onSubmit,
}: UseDatasetFormProps) => {
  const [formData, setFormData] = useState<DatasetFormData>(
    initialData || createEmptyFormData(),
  );
  const [currentStep, setCurrentStep] = useState<EditorSteps>("basicInfo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datasourceId = formData.datasourceId
    ? parseInt(formData.datasourceId, 10)
    : 0;
  const { data: selectedDatasource } = useDatasource(datasourceId);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (formData.datasourceId) {
      updateFormData({
        tables: [],
        mainTable: "",
        joins: [],
      });
    }
  }, [formData.datasourceId]);

  const currentStepIndex = useMemo(
    () => STEPS.indexOf(currentStep),
    [currentStep],
  );

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case "basicInfo":
        return !!formData.name.trim();
      case "dataSource":
        return (
          !!formData.datasourceId &&
          formData.tables.length > 0 &&
          formData.mainTable
        );
      case "joinConfig":
        return formData.tables.length <= 1 || formData.joins.length > 0;
      case "fieldConfig":
        return formData.fields.length > 0;
      default:
        return true;
    }
  }, [currentStep, formData]);

  const goToNextStep = useCallback(() => {
    if (!isLastStep && canGoNext()) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStepIndex, isLastStep, canGoNext]);

  const goToPrevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, isFirstStep]);

  const goToStep = useCallback(
    (step: EditorSteps) => {
      const targetIndex = STEPS.indexOf(step);
      if (targetIndex <= currentStepIndex) {
        setCurrentStep(step);
      }
    },
    [currentStepIndex],
  );

  const updateFormData = useCallback((updates: Partial<DatasetFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getLockedFields = useCallback((): Set<string> => {
    const lockedFields = new Set<string>();

    formData.joins.forEach((join) => {
      lockedFields.add(join.leftField);
      lockedFields.add(join.rightField);
    });

    formData.metrics.forEach((metric) => {
      const fieldMatches = formData.fields.filter((field) =>
        metric.expression.includes(field),
      );
      fieldMatches.forEach((field) => lockedFields.add(field));
    });

    return lockedFields;
  }, [formData.joins, formData.metrics, formData.fields]);

  const toggleField = useCallback(
    (fieldId: string) => {
      const lockedFields = getLockedFields();
      if (lockedFields.has(fieldId)) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.includes(fieldId)
          ? prev.fields.filter((id) => id !== fieldId)
          : [...prev.fields, fieldId],
      }));
    },
    [getLockedFields],
  );

  const addJoin = useCallback((join: JoinConfig) => {
    setFormData((prev) => ({
      ...prev,
      joins: [...prev.joins, join],
    }));
  }, []);

  const removeJoin = useCallback((joinId: string) => {
    setFormData((prev) => ({
      ...prev,
      joins: prev.joins.filter((j) => j.id !== joinId),
    }));
  }, []);

  const updateJoin = useCallback(
    (joinId: string, updates: Partial<JoinConfig>) => {
      setFormData((prev) => ({
        ...prev,
        joins: prev.joins.map((j) =>
          j.id === joinId ? { ...j, ...updates } : j,
        ),
      }));
    },
    [],
  );

  const addMetric = useCallback((metric: MetricConfig) => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, metric],
    }));
  }, []);

  const removeMetric = useCallback((metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== metricId),
    }));
  }, []);

  const updateMetric = useCallback(
    (metricId: string, updates: Partial<MetricConfig>) => {
      setFormData((prev) => ({
        ...prev,
        metrics: prev.metrics.map((m) =>
          m.id === metricId ? { ...m, ...updates } : m,
        ),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!canGoNext()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, canGoNext, onSubmit]);

  return {
    formData,
    selectedDatasource,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    isSubmitting,
    isCreateMode,
    steps: STEPS,
    canGoNext,
    goToNextStep,
    goToPrevStep,
    goToStep,
    updateFormData,
    getLockedFields,
    toggleField,
    addJoin,
    removeJoin,
    updateJoin,
    addMetric,
    removeMetric,
    updateMetric,
    handleSubmit,
  };
};
