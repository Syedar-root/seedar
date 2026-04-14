import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  QueryColumnMapping,
} from '#pkg/seedar/types';
import { useEffect, useMemo, useState } from 'react';
import { useExecuteQuery } from '../../hooks';
import { applyFormattingToQueryData } from '../formatting/formatting';
import styles from './metricCard.module.css';

export interface MetricCardProps {
  queryId?: string;
  data?: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
}

const normalizeMappings = (
  result?: ExecuteQueryResponse,
): QueryColumnMapping[] => {
  if (Array.isArray(result?.columnMappings) && result.columnMappings.length > 0) {
    return result.columnMappings;
  }

  const headers = result?.results?.header || [];
  return headers.map((header, index) => ({
    alias: `col_${index}`,
    type: 'dimension',
    displayName: header,
    businessName: header,
    index,
    target: { kind: 'unknown' },
  }));
};

export const MetricCard: React.FC<MetricCardProps> = ({
  queryId,
  data,
  formatting,
}) => {
  const { mutate: executeQuery } = useExecuteQuery();
  const [rawData, setRawData] = useState<ExecuteQueryResponse | undefined>(data);

  useEffect(() => {
    if (data) {
      setRawData(data);
      return;
    }

    if (!queryId) {
      return;
    }

    executeQuery(queryId, {
      onSuccess: (queryData) => {
        setRawData(queryData);
      },
    });
  }, [data, executeQuery, queryId]);

  const cardData = useMemo(() => {
    if (!rawData) {
      return undefined;
    }

    const formattedData = applyFormattingToQueryData(rawData, formatting, {
      surface: 'card_value',
    });

    const rows = formattedData.results?.rows || [];
    const firstRow = rows[0] || [];
    const mappings = normalizeMappings(formattedData);
    const metricMappings = mappings.filter((mapping) => mapping.type === 'metric');
    const primaryMapping = metricMappings[0] || mappings[0];
    const secondaryMapping = metricMappings[1];

    if (!primaryMapping) {
      return undefined;
    }

    const primaryIndex = primaryMapping.index ?? mappings.indexOf(primaryMapping);
    const secondaryIndex = secondaryMapping
      ? secondaryMapping.index ?? mappings.indexOf(secondaryMapping)
      : -1;

    const primaryValue = firstRow[primaryIndex] ?? '--';
    const secondaryValue = secondaryIndex >= 0 ? firstRow[secondaryIndex] : undefined;

    return {
      title: primaryMapping.businessName || primaryMapping.displayName,
      value: primaryValue,
      subTitle: secondaryMapping
        ? secondaryMapping.businessName || secondaryMapping.displayName
        : undefined,
      subValue: secondaryValue,
    };
  }, [formatting, rawData]);

  if (!cardData) {
    return null;
  }

  return (
    <div className={styles.card}>
      <div className={styles.title}>{cardData.title}</div>
      <div className={styles.value}>{cardData.value}</div>
      {cardData.subTitle ? (
        <div className={styles.subRow}>
          <span className={styles.subTitle}>{cardData.subTitle}</span>
          <span className={styles.subValue}>{cardData.subValue}</span>
        </div>
      ) : null}
    </div>
  );
};
