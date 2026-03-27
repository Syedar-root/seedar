import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { SeedarTitle as Title } from "#pkg/seedar/ui-react";
import { TitleEditorDialog } from "./TitleEditorDialog";
import { EditableTitleProps, TitleConfig } from "./types";
import styles from "./editableTitle.module.scss";

export const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  titleConfig,
  onTitleChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getCurrentConfig = (): TitleConfig => {
    if (titleConfig) {
      return titleConfig;
    }
    return {
      type: "plain",
      content: title,
    };
  };

  const currentConfig = getCurrentConfig();

  const handleEdit = () => {
    setIsDialogOpen(true);
  };

  const handleSave = (newTitle: string, newTitleConfig: TitleConfig) => {
    onTitleChange(newTitle, newTitleConfig);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={styles.editableTitle}>
        <Title
          type={currentConfig.type}
          content={currentConfig.content}
          flagColor={currentConfig.flagColor}
          subtitle={currentConfig.subtitle}
          accentText={currentConfig.accentText}
          enableTooltip={currentConfig.enableTooltip}
          maxTitleWidth={currentConfig.maxTitleWidth}
        />
        <Pencil
          size={14}
          className={styles.editIcon}
          onClick={handleEdit}
        />
      </div>

      <TitleEditorDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialTitle={title}
        initialTitleConfig={titleConfig}
      />
    </>
  );
};
