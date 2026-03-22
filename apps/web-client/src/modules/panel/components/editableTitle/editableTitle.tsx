import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import styles from "./editableTitle.module.scss";

interface EditableTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  onTitleChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    onTitleChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <div className={styles.editableTitle}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={styles.input}
        />
        <Check size={16} className={styles.actionIcon} onClick={handleSave} />
        <X size={16} className={styles.actionIcon} onClick={handleCancel} />
      </div>
    );
  }

  return (
    <div className={styles.editableTitle}>
      <span className={styles.title}>{title}</span>
      <Pencil size={14} className={styles.editIcon} onClick={handleStartEdit} />
    </div>
  );
};
