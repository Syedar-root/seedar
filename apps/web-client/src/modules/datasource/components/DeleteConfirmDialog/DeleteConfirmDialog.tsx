import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useDeleteDatasource, useDatasets } from "#pkg/seedar/ui-react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import styles from "./DeleteConfirmDialog.module.scss";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  datasourceId: number;
  datasourceName: string;
  onSuccess: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  datasourceId,
  datasourceName,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: datasets } = useDatasets();
  const { mutate: deleteDatasource } = useDeleteDatasource();

  const checkDatasourceInUse = (): {
    inUse: boolean;
    datasets: Array<{ id: number; name: string }>;
  } => {
    if (!datasets) {
      return { inUse: false, datasets: [] };
    }

    const usingDatasets = datasets.filter(
      (dataset) => dataset.datasource?.id === datasourceId,
    );

    return {
      inUse: usingDatasets.length > 0,
      datasets: usingDatasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
      })),
    };
  };

  const { inUse, datasets: usingDatasets } = checkDatasourceInUse();

  const handleDelete = () => {
    if (inUse) {
      toast.error("无法删除正在被使用的数据源");
      return;
    }

    setIsDeleting(true);

    deleteDatasource(datasourceId, {
      onSuccess: () => {
        setIsDeleting(false);
        toast.success("数据源删除成功");
        onSuccess();
      },
      onError: (err) => {
        setIsDeleting(false);
        const errorMessage = err.message || "删除失败，请稍后重试";
        toast.error(errorMessage);
      },
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <AlertTriangle size={32} className={styles.warningIcon} />
            </div>

            <Dialog.Title className={styles.title} id="dialog-title">
              确认删除数据源
            </Dialog.Title>

            <div className={styles.message}>
              <p className={styles.messageText}>
                确定要删除数据源 <strong>"{datasourceName}"</strong> 吗？
              </p>
              <p className={styles.messageSubtext}>
                此操作无法撤销，删除后数据源将无法恢复。
              </p>
            </div>

            {inUse && (
              <div className={styles.errorSection}>
                <div className={styles.errorHeader}>
                  <AlertTriangle size={16} className={styles.errorIcon} />
                  <span className={styles.errorTitle}>数据源正在被使用</span>
                </div>
                <div className={styles.errorContent}>
                  <p className={styles.errorText}>
                    该数据源正在被以下数据集使用，无法删除：
                  </p>
                  <ul className={styles.datasetList}>
                    {usingDatasets.map((dataset) => (
                      <li key={dataset.id} className={styles.datasetItem}>
                        {dataset.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={isDeleting || inUse}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    删除中...
                  </>
                ) : (
                  "确定删除"
                )}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
