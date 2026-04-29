import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  useCreateDatasource,
  useTestDatasourceConnection,
  useUpdateDatasource,
} from "#pkg/seedar/ui-react";
import { toast } from "sonner";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { DatasourceTypeSelector } from "../DatasourceTypeSelector/DatasourceTypeSelector";
import {
  ConnectionForm,
  type ConnectionConfig,
} from "../ConnectionForm/ConnectionForm";
import { ConnectionTest } from "../ConnectionTest/ConnectionTest";
import styles from "./DatasourceFormDialog.module.scss";
import type { DatasourceFormDialogProps } from "./types";
import {
  buildCreateDatasourcePayload,
  buildTestConnectionPayload,
  buildUpdateDatasourcePayload,
  getDatasourceDefaultPort,
  getDatasourceFormInitialState,
  validateDatasourceForm,
} from "./utils/datasourceForm.utils";

const DIALOG_TITLE_MAP = {
  create: "创建数据源",
  edit: "编辑数据源",
} as const;

const SUBMIT_LABEL_MAP = {
  create: {
    idle: "创建数据源",
    loading: "创建中...",
    success: "数据源创建成功",
    failure: "创建失败，请稍后重试",
  },
  edit: {
    idle: "保存修改",
    loading: "保存中...",
    success: "数据源更新成功",
    failure: "更新失败，请稍后重试",
  },
} as const;

export const DatasourceFormDialog: React.FC<DatasourceFormDialogProps> = ({
  open,
  mode,
  datasource,
  onClose,
  onSuccess,
}) => {
  const [datasourceType, setDatasourceType] = useState<ConnectionConfig["type"]>("mysql");
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    type: "mysql",
    name: "",
    port: getDatasourceDefaultPort("mysql"),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSupportedDatasource, setIsSupportedDatasource] = useState(true);

  const submitLabels = useMemo(() => SUBMIT_LABEL_MAP[mode], [mode]);

  const { mutate: createDatasource } = useCreateDatasource();
  const { mutate: updateDatasource } = useUpdateDatasource();
  const { mutateAsync: testDatasourceConnection } = useTestDatasourceConnection();

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialState = getDatasourceFormInitialState(datasource);
    setDatasourceType(initialState.datasourceType);
    setConnectionConfig(initialState.connectionConfig);
    setIsSupportedDatasource(initialState.isSupported);
    setError(undefined);
    setIsSubmitting(false);
  }, [datasource, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleDatasourceTypeChange = (type: ConnectionConfig["type"]) => {
    setDatasourceType(type);
    setConnectionConfig((previous) => ({
      ...previous,
      type,
      port:
        previous.type === type && previous.port
          ? previous.port
          : getDatasourceDefaultPort(type),
    }));
    setError(undefined);
    setIsSupportedDatasource(true);
  };

  const handleConnectionConfigChange = (config: ConnectionConfig) => {
    setConnectionConfig(config);
    setError(undefined);
  };

  const handleTestConnection = async (config: ConnectionConfig) => {
    const request = buildTestConnectionPayload(config);

    if (!request) {
      return {
        success: false,
        message: "当前数据源类型暂不支持测试连接",
      };
    }

    return testDatasourceConnection(request);
  };

  const handleSubmit = () => {
    setError(undefined);

    const validationResult = validateDatasourceForm(connectionConfig, {
      mode,
      datasourceType,
    });

    if (!validationResult.success) {
      setError(validationResult.message);
      return;
    }

    setIsSubmitting(true);

    if (mode === "create") {
      const payload = buildCreateDatasourcePayload(connectionConfig, datasourceType);

      if (!payload) {
        setIsSubmitting(false);
        setError("当前数据源类型暂不支持");
        return;
      }

      createDatasource(payload, {
        onSuccess: (createdDatasource) => {
          setIsSubmitting(false);
          toast.success(submitLabels.success);
          onSuccess(createdDatasource.id);
        },
        onError: (submitError) => {
          setIsSubmitting(false);
          setError(submitError.message || submitLabels.failure);
        },
      });
      return;
    }

    if (!datasource?.id) {
      setIsSubmitting(false);
      setError("缺少待编辑的数据源信息");
      return;
    }

    const payload = buildUpdateDatasourcePayload(connectionConfig, datasourceType);

    if (!payload) {
      setIsSubmitting(false);
      setError("当前数据源类型暂不支持");
      return;
    }

    updateDatasource(
      {
        id: datasource.id,
        data: payload,
      },
      {
        onSuccess: (updatedDatasource) => {
          setIsSubmitting(false);
          toast.success(submitLabels.success);
          onSuccess(updatedDatasource.id);
        },
        onError: (submitError) => {
          setIsSubmitting(false);
          setError(submitError.message || submitLabels.failure);
        },
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title} id="dialog-title">
              {DIALOG_TITLE_MAP[mode]}
            </Dialog.Title>

            <ScrollArea
              style={{ flex: 1, minHeight: 0 }}
              contentStyle={{ minWidth: 0 }}
            >
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    数据源名称<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={connectionConfig.name}
                    onChange={(event) =>
                      handleConnectionConfigChange({
                        ...connectionConfig,
                        name: event.target.value,
                      })
                    }
                    placeholder="请输入数据源名称"
                    aria-required="true"
                    aria-describedby={error ? "datasource-form-error" : undefined}
                  />
                </div>

                {!isSupportedDatasource && (
                  <p className={styles.tips}>
                    当前数据源类型未被这个前端表单完整支持，已按 MySQL 表单回填基础信息。
                    如需避免字段丢失，建议暂时不要直接在这里保存。
                  </p>
                )}

                <DatasourceTypeSelector
                  value={datasourceType}
                  onChange={handleDatasourceTypeChange}
                />

                <ConnectionForm
                  type={datasourceType}
                  config={connectionConfig}
                  onChange={handleConnectionConfigChange}
                />

                <ConnectionTest
                  config={connectionConfig}
                  onTest={handleTestConnection}
                />

                {error && (
                  <div
                    className={styles.errorText}
                    id="datasource-form-error"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                取消
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? submitLabels.loading : submitLabels.idle}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
