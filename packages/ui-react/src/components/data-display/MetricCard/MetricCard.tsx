import styles from './MetricCard.module.css';

import { useMetricCardData } from "./hooks/useMetricCardData.hook";
import type { MetricCardProps } from "./types";

export const MetricCard: React.FC<MetricCardProps> = ({
  queryId,
  data,
  formatting,
}) => {
  const cardData = useMetricCardData({
    queryId,
    data,
    formatting,
  });

  if (!cardData) {
    return null;
  }

  return (
    <div className={styles.card}>
      <div className={styles.title}>{cardData.title}</div>
      <div className={styles.value}>{String(cardData.value)}</div>
      {cardData.subTitle ? (
        <div className={styles.subRow}>
          <span className={styles.subTitle}>{cardData.subTitle}</span>
          <span className={styles.subValue}>{String(cardData.subValue ?? "")}</span>
        </div>
      ) : null}
    </div>
  );
};
