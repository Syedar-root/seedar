import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { SeedarTitle as Title } from "#pkg/seedar/ui-react";
import { TitleConfig } from "./types";
import styles from "./TitleEditorDialog.module.scss";

interface TitleEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, titleConfig: TitleConfig) => void;
  initialTitle: string;
  initialTitleConfig?: TitleConfig;
}

const getInitialConfig = (
  initialTitle: string,
  initialTitleConfig?: TitleConfig,
): TitleConfig => {
  if (initialTitleConfig) {
    return initialTitleConfig;
  }
  return {
    type: "plain",
    content: initialTitle,
  };
};

const shouldKeepFlagColor = (type: TitleConfig["type"]): boolean => {
  return type === "flag" || type === "brutalist";
};

const shouldKeepSubtitle = (type: TitleConfig["type"]): boolean => {
  return type === "editorial" || type === "brutalist";
};

const shouldKeepNumber = (type: TitleConfig["type"]): boolean => {
  return type === "brutalist";
};

export const TitleEditorDialog: React.FC<TitleEditorDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  initialTitleConfig,
}) => {
  const [config, setConfig] = useState<TitleConfig>(
    getInitialConfig(initialTitle, initialTitleConfig),
  );
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) {
      setConfig(getInitialConfig(initialTitle, initialTitleConfig));
      setError(undefined);
    }
  }, [isOpen, initialTitle, initialTitleConfig]);

  const handleTypeChange = (newType: TitleConfig["type"]) => {
    setConfig((prev) => ({
      ...prev,
      type: newType,
      flagColor: shouldKeepFlagColor(newType) ? prev.flagColor : undefined,
      subtitle: shouldKeepSubtitle(newType) ? prev.subtitle : undefined,
      accentText: newType === "editorial" ? prev.accentText : undefined,
      number: shouldKeepNumber(newType) ? prev.number : undefined,
    }));
  };

  const handleFieldChange = (field: keyof TitleConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!config.content.trim()) {
      setError("主标题不能为空");
      return;
    }
    onSave(config.content, config);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title}>编辑标题</Dialog.Title>

            <div className={styles.typeSelector}>
              {(["plain", "flag", "editorial", "brutalist"] as const).map(
                (type) => (
                  <label key={type} className={styles.typeOption}>
                    <input
                      type="radio"
                      name="titleType"
                      value={type}
                      checked={config.type === type}
                      onChange={() => handleTypeChange(type)}
                      className={styles.typeRadio}
                    />
                    <span className={styles.typeLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </label>
                ),
              )}
            </div>

            <div className={styles.previewArea}>
              <Title
                type={config.type}
                content={config.content || "预览标题"}
                flagColor={config.flagColor}
                subtitle={config.subtitle}
                accentText={config.accentText}
                number={config.number}
                enableTooltip={false}
              />
            </div>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  主标题 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  placeholder="请输入主标题"
                  onKeyDown={handleKeyDown}
                />
              </div>

              {shouldKeepFlagColor(config.type) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>标记颜色</label>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={config.flagColor || "#008ffa"}
                    onChange={(e) =>
                      handleFieldChange("flagColor", e.target.value)
                    }
                  />
                </div>
              )}

              {shouldKeepSubtitle(config.type) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>副标题</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={config.subtitle || ""}
                    onChange={(e) =>
                      handleFieldChange("subtitle", e.target.value)
                    }
                    placeholder="请输入副标题（可选）"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}

              {shouldKeepNumber(config.type) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>序号</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={config.number || ""}
                    onChange={(e) =>
                      handleFieldChange("number", e.target.value || undefined)
                    }
                    placeholder="请输入序号（可选）"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}

              {config.type === "editorial" && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>强调文字</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={config.accentText || ""}
                    onChange={(e) =>
                      handleFieldChange("accentText", e.target.value)
                    }
                    placeholder="请输入强调文字（可选）"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}

              {error && <div className={styles.errorText}>{error}</div>}
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose}>
                取消
              </button>
              <button className={styles.saveButton} onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
