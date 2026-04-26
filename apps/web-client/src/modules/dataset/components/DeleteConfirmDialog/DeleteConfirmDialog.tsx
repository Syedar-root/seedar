import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useDeleteDataset, useQueries } from "#pkg/seedar/ui-react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import styles from "./DeleteConfirmDialog.module.scss";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  datasetId: number;
  datasetName: string;
  onSuccess: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  datasetId,
  datasetName,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: queries } = useQueries();
  const { mutate: deleteDataset } = useDeleteDataset();

  const usingQueries = useMemo(
    () =>
      (queries || [])
        .filter((query) => query.datasetId === datasetId)
        .map((query) => ({
          id: query.id,
          name: query.name,
        })),
    [datasetId, queries],
  );

  const inUse = usingQueries.length > 0;

  const handleDelete = () => {
    if (inUse) {
      toast.error("无法删除正在被查询使用的数据集");
      return;
    }

    setIsDeleting(true);

    deleteDataset(datasetId, {
      onSuccess: () => {
        setIsDeleting(false);
        toast.success("数据集删除成功");
        onSuccess();
      },
      onError: (error) => {
        setIsDeleting(false);
        toast.error(error.message || "删除失败，请稍后重试");
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
              确认删除数据集
            </Dialog.Title>

            <div className={styles.message}>
              <p className={styles.messageText}>
                确定要删除数据集 <strong>"{datasetName}"</strong> 吗？
              </p>
              <p className={styles.messageSubtext}>
                删除后该数据集将从列表中隐藏，且无法直接恢复。
              </p>
            </div>

            {inUse && (
              <div className={styles.errorSection}>
                <div className={styles.errorHeader}>
                  <AlertTriangle size={16} className={styles.errorIcon} />
                  <span className={styles.errorTitle}>数据集正在被查询使用</span>
                </div>
                <div className={styles.errorContent}>
                  <p className={styles.errorText}>
                    请先删除或修改以下查询，再删除当前数据集：
                  </p>
                  <ul className={styles.datasetList}>
                    {usingQueries.map((query) => (
                      <li key={query.id} className={styles.datasetItem}>
                        {query.name}
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
                  "确认删除"
                )}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
