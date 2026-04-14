import { Menu } from "@base-ui/react";
import { Check, ChevronDownIcon, X } from "lucide-react";
import styles from "./dimensionItem.module.scss";
import type { DimensionItem as DimensionItemType } from "../../../../hooks/usePanelEditorState";

interface DimensionItemProps {
  dimension: DimensionItemType;
  hasDerivedConfig: boolean;
  hasFormattingConfig?: boolean;
  onOpenConfig: (dimension: DimensionItemType) => void;
  onOpenFormattingDialog: (dimension: DimensionItemType) => void;
  onRemove: (dimension: DimensionItemType) => void;
}

export const DimensionItem = ({
  dimension,
  hasDerivedConfig,
  hasFormattingConfig,
  onOpenConfig,
  onOpenFormattingDialog,
  onRemove,
}: DimensionItemProps) => {
  return (
    <div className={styles.dimension}>
      <Menu.Root>
        <Menu.Trigger className={styles.trigger}>
          {dimension.businessName || dimension.name}
          {dimension.isDerived && dimension.derivedKind ? (
            <span className={styles.derivedTag}>{dimension.derivedKind}</span>
          ) : null}
          <ChevronDownIcon className={styles.chevronIcon} size={12} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.menuPositioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item
                onClick={() => onOpenConfig(dimension)}
                className={styles.CheckboxItem}
              >
                <span className={styles.CheckboxItemText}>衍生维度</span>
                <span className={styles.CheckboxItemIndicator}>
                  {hasDerivedConfig && (
                    <Check
                      className={styles.CheckboxItemIndicatorIcon}
                      size={12}
                    />
                  )}
                </span>
              </Menu.Item>
              <Menu.Item
                onClick={() => onOpenFormattingDialog(dimension)}
                className={styles.CheckboxItem}
              >
                <span className={styles.CheckboxItemText}>格式化</span>
                <span className={styles.CheckboxItemIndicator}>
                  {hasFormattingConfig && (
                    <Check
                      className={styles.CheckboxItemIndicatorIcon}
                      size={12}
                    />
                  )}
                </span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <button
        type="button"
        className={styles.removeButton}
        onClick={() => onRemove(dimension)}
        title="移除维度"
      >
        <X size={12} />
      </button>
    </div>
  );
};
