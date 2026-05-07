import type React from "react";
import type { AiSessionResponse } from "#pkg/seedar/types";

export interface HistorySessionMenuProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  sessions: AiSessionResponse[];
  currentSessionId?: string | null;
  onSelectSession: (session: AiSessionResponse) => void;
  onDeleteSession: (session: AiSessionResponse) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLDivElement>;
}
