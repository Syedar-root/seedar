import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useCreateDatasource } from "#pkg/seedar/ui-react";
import { toast } from "sonner";
import { DatasourceTypeSelector } from "../DatasourceTypeSelector/DatasourceTypeSelector";
import {
  ConnectionForm,
  type ConnectionConfig,
} from "../ConnectionForm/ConnectionForm";
import { ConnectionTest } from "../ConnectionTest/ConnectionTest";
import type { DatasourceType } from "../DatasourceTypeSelector/DatasourceTypeSelector";
import styles from "./CreateDatasourceDialog.module.scss";

interface CreateDatasourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (datasourceId: number) => void;
}

export const CreateDatasourceDialog: React.FC<CreateDatasourceDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [datasourceType, setDatasourceType] = useState<DatasourceType>("mysql");
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    type: "mysql",
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { mutate: createDatasource } = useCreateDatasource();

  const validateForm = (): boolean => {
    if (!connectionConfig.name.trim()) {
      setError("请输入数据源名称");
      return false;
    }

    if (!connectionConfig.host?.trim()) {
      setError("请输入主机地址");
      return false;
    }
    if (!connectionConfig.port?.trim()) {
      setError("请输入端口");
      return false;
    }
    if (!connectionConfig.database?.trim()) {
      setError("请输入数据库名");
      return false;
    }
    if (!connectionConfig.username?.trim()) {
      setError("请输入用户名");
      return false;
    }
    if (!connectionConfig.password?.trim()) {
      setError("请输入密码");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError(undefined);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const createData: any = {
      name: connectionConfig.name,
      type: datasourceType,
    };

    if (datasourceType === "mysql") {
      createData.config = {
        host: connectionConfig.host,
        port: connectionConfig.port || "3306",
        database: connectionConfig.database,
        username: connectionConfig.username,
        password: connectionConfig.password,
      };
    } else if (datasourceType === "postgres") {
      createData.config = {
        host: connectionConfig.host,
        port: connectionConfig.port || "5432",
        database: connectionConfig.database,
        username: connectionConfig.username,
        password: connectionConfig.password,
      };
    } else if (datasourceType === "clickhouse") {
      createData.config = {
        host: connectionConfig.host,
        port: connectionConfig.port || "8123",
        database: connectionConfig.database,
        username: connectionConfig.username,
        password: connectionConfig.password,
      };
    }

    createDatasource(createData, {
      onSuccess: (data) => {
        setIsSubmitting(false);
        toast.success("数据源创建成功");
        onSuccess(data.id);
      },
      onError: (err) => {
        setIsSubmitting(false);
        setError(err.message || "创建失败，请稍后重试");
      },
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleDatasourceTypeChange = (type: DatasourceType) => {
    setDatasourceType(type);
    setConnectionConfig({
      ...connectionConfig,
      type,
    });
    setError(undefined);
  };

  const handleConnectionConfigChange = (config: ConnectionConfig) => {
    setConnectionConfig(config);
    setError(undefined);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title} id="dialog-title">
              创建数据源
            </Dialog.Title>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  数据源名称 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={connectionConfig.name}
                  onChange={(e) =>
                    handleConnectionConfigChange({
                      ...connectionConfig,
                      name: e.target.value,
                    })
                  }
                  placeholder="请输入数据源名称"
                  aria-required="true"
                  aria-describedby={error ? "name-error" : undefined}
                />
              </div>

              <DatasourceTypeSelector
                value={datasourceType}
                onChange={handleDatasourceTypeChange}
              />

              <ConnectionForm
                type={datasourceType}
                config={connectionConfig}
                onChange={handleConnectionConfigChange}
              />

              <ConnectionTest config={connectionConfig} />

              {error && (
                <div
                  className={styles.errorText}
                  id="name-error"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose}>
                取消
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "创建中..." : "创建数据源"}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
