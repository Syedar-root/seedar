import type React from "react";

export interface HeaderProps {
  title?: React.ReactNode;
  onAddChat?: () => void;
  onShowHistory?: () => void;
}
