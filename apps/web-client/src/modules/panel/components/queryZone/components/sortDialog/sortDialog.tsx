import { Dialog } from "@base-ui/react";
import { Select } from "@/core/components/ui/Select";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SortCandidate, SortItem } from "../../../../types";
import { createSortItemFromCandidate } from "../../../../utils/querySort";
import styles from "./sortDialog.module.scss";

type DraftSortRow = {
  rowId: string;
  candidateId: string;
  dir: "asc" | "desc";
};

interface SortDialogProps {
  open: boolean;
  candidates: SortCandidate[];
  sortItems: SortItem[];
  topN?: number;
  onClose: () => void;
  onSave: (nextSortItems: SortItem[], nextTopN?: number) => void;
}

const DIRECTION_OPTIONS = [
  { label: "升序", value: "asc" },
  { label: "降序", value: "desc" },
] as const;

const buildRowId = () => `sort_row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createEmptyRow = (): DraftSortRow => ({
  rowId: buildRowId(),
  candidateId: "",
  dir: "desc",
});

export const SortDialog = ({
  open,
  candidates,
  sortItems,
  topN,
  onClose,
  onSave,
}: SortDialogProps) => {
  const [draftRows, setDraftRows] = useState<DraftSortRow[]>([createEmptyRow()]);
  const [draftTopN, setDraftTopN] = useState<string>("");
  const [error, setError] = useState<string>();

  const candidateMap = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.id, candidate])),
    [candidates],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (sortItems.length === 0) {
      setDraftRows([createEmptyRow()]);
      setDraftTopN(topN !== undefined ? String(topN) : "");
      setError(undefined);
      return;
    }

    setDraftRows(
      sortItems.map((item) => ({
        rowId: buildRowId(),
        candidateId: `${item.sourceType}:${item.sourceId}`,
        dir: item.dir,
      })),
    );
    setDraftTopN(topN !== undefined ? String(topN) : "");
    setError(undefined);
  }, [open, sortItems, topN]);

  const buildCandidateOptions = (currentCandidateId: string) => {
    const selectedIds = new Set(
      draftRows
        .map((row) => row.candidateId)
        .filter((candidateId) => candidateId && candidateId !== currentCandidateId),
    );

    return candidates.map((candidate) => ({
      label: candidate.label,
      value: candidate.id,
      disabled: selectedIds.has(candidate.id),
    }));
  };

  const handleAddRow = () => {
    setDraftRows((previous) => [...previous, createEmptyRow()]);
  };

  const handleRemoveRow = (rowId: string) => {
    setDraftRows((previous) => {
      const nextRows = previous.filter((row) => row.rowId !== rowId);
      return nextRows.length > 0 ? nextRows : [createEmptyRow()];
    });
  };

  const handleMoveRow = (rowId: string, direction: "up" | "down") => {
    setDraftRows((previous) => {
      const index = previous.findIndex((row) => row.rowId === rowId);
      if (index < 0) {
        return previous;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const nextRows = [...previous];
      const [row] = nextRows.splice(index, 1);
      nextRows.splice(targetIndex, 0, row);
      return nextRows;
    });
  };

  const handleSave = () => {
    const normalizedRows = draftRows.filter((row) => row.candidateId);
    const seenCandidates = new Set<string>();
    const nextSortItems: SortItem[] = [];

    for (const row of normalizedRows) {
      if (seenCandidates.has(row.candidateId)) {
        setError("排序项不能重复，请为每个字段或指标只保留一条排序规则。");
        return;
      }

      const candidate = candidateMap.get(row.candidateId);
      if (!candidate) {
        setError("存在无效的排序项，请重新选择。");
        return;
      }

      seenCandidates.add(row.candidateId);
      nextSortItems.push({
        ...createSortItemFromCandidate(candidate),
        dir: row.dir,
      });
    }

    const parsedTopN =
      draftTopN.trim() === "" ? undefined : Number(draftTopN.trim());
    if (parsedTopN !== undefined) {
      if (Number.isNaN(parsedTopN) || parsedTopN <= 0) {
        setError("Top N 必须是大于 0 的整数。");
        return;
      }
    }

    setError(undefined);
    onSave(
      nextSortItems,
      parsedTopN === undefined ? undefined : Math.floor(parsedTopN),
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.overlay} />
        <Dialog.Popup className={styles.container}>
          <Dialog.Title className={styles.header}>配置排序</Dialog.Title>
          <Dialog.Description className={styles.content}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>排序规则</label>
              <div className={styles.helperText}>
                保存后会按从左到右展示排序优先级，越靠左优先级越高。
              </div>
              <div className={styles.ruleList}>
                {draftRows.map((row, index) => (
                  <div className={styles.ruleRow} key={row.rowId}>
                    <div className={styles.ruleIndex}>{index + 1}</div>
                    <Select
                      value={row.candidateId}
                      onChange={(value) =>
                        setDraftRows((previous) =>
                          previous.map((entry) =>
                            entry.rowId === row.rowId
                              ? {
                                  ...entry,
                                  candidateId: value || "",
                                  dir:
                                    value && candidateMap.get(value)
                                      ? candidateMap.get(value)!.defaultDir
                                      : entry.dir,
                                }
                              : entry,
                          ),
                        )
                      }
                      options={buildCandidateOptions(row.candidateId)}
                      placeholder="选择字段、指标或临时指标"
                      className={styles.selectControl}
                    />
                    <Select
                      value={row.dir}
                      onChange={(value) =>
                        setDraftRows((previous) =>
                          previous.map((entry) =>
                            entry.rowId === row.rowId
                              ? {
                                  ...entry,
                                  dir: (value as "asc" | "desc") || "desc",
                                }
                              : entry,
                          ),
                        )
                      }
                      options={DIRECTION_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                      className={styles.directionControl}
                      clearable={false}
                    />
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleMoveRow(row.rowId, "up")}
                        disabled={index === 0}
                        title="提高优先级"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleMoveRow(row.rowId, "down")}
                        disabled={index === draftRows.length - 1}
                        title="降低优先级"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleRemoveRow(row.rowId)}
                        title="删除排序项"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.addRuleButton}
                onClick={handleAddRow}
              >
                <Plus size={14} />
                添加排序项
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Top N</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={draftTopN}
                onChange={(event) => setDraftTopN(event.target.value)}
                placeholder="留空表示不限制"
              />
            </div>

            {error ? <div className={styles.errorText}>{error}</div> : null}
          </Dialog.Description>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setDraftRows([createEmptyRow()]);
                setDraftTopN("");
                setError(undefined);
              }}
            >
              清空
            </button>
            <div className={styles.footerRight}>
              <Dialog.Close className={styles.cancelButton} onClick={onClose}>
                取消
              </Dialog.Close>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
