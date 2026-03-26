import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useCreateDashboard } from "#pkg/seedar/ui-react";
import styles from "./CreateDashboardDialog.module.scss";

interface CreateDashboardDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (dashboardId: string) => void;
}

export const CreateDashboardDialog: React.FC<CreateDashboardDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { mutate: createDashboard } = useCreateDashboard();

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("请输入看板名称");
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

    createDashboard(
      { name },
      {
        onSuccess: (data) => {
          setIsSubmitting(false);
          onSuccess(data.id);
        },
        onError: (err) => {
          setIsSubmitting(false);
          setError(err.message || "创建失败，请稍后重试");
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title} id="dialog-title">
              新建看板
            </Dialog.Title>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  看板名称 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入看板名称"
                  onKeyDown={handleKeyDown}
                  aria-required="true"
                  aria-describedby={error ? "name-error" : undefined}
                />
                {error && (
                  <div className={styles.errorText} id="name-error" role="alert" aria-live="polite">
                    {error}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>描述（可选）</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入描述（可选）"
                />
              </div>
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
                {isSubmitting ? "创建中..." : "创建看板"}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
