import { Tooltip } from "@base-ui/react/tooltip";
import styles from "./title.module.css";

interface TitleProps {
  content?: string;
  type?: "plain" | "flag";
  flagColor?: string;
  enableTooltip?: boolean;
  maxTitleWidth?: string;
}

export const Title: React.FC<TitleProps> = ({
  content,
  type = "flag",
  flagColor = "#008ffa",
  enableTooltip = true,
  maxTitleWidth = "300px",
}: TitleProps) => {
  if (type === "plain") {
    return <h3 className={styles.plain}>{content}</h3>;
  }
  if (type === "flag") {
    const flagContent = (
      <div
        className={styles.flagContainer}
        style={
          {
            "--flag-color": flagColor,
            "--max-title-width": maxTitleWidth,
          } as React.CSSProperties
        }
      >
        <div className={styles.flagMarker}></div>
        <div className={styles.flagContent}>{content}</div>
      </div>
    );

    if (enableTooltip && content) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger style={{ maxWidth: maxTitleWidth }}>
              {flagContent}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className={styles.tooltip}>
                  {content}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return flagContent;
  }
  return null;
};
