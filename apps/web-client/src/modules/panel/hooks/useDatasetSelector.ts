import { useDatasets } from "#pkg/seedar/ui-react";
import type { DatasetResponse } from "#pkg/seedar/types";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseDatasetSelectorOptions {
  initialSelectedDatasetId?: number;
}

interface UseDatasetSelectorReturn {
  datasets: DatasetResponse[];
  filteredDatasets: DatasetResponse[];
  isLoading: boolean;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  selectedDatasetId?: number;
  selectedDataset?: DatasetResponse;
  handleSelectDataset: (dataset: DatasetResponse) => void;
  setSelectedDataset: (dataset?: DatasetResponse) => void;
  clearSelection: () => void;
}

export const useDatasetSelector = ({
  initialSelectedDatasetId,
}: UseDatasetSelectorOptions = {}): UseDatasetSelectorReturn => {
  const { data, isLoading } = useDatasets();
  const datasets = data ?? [];

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | undefined>(
    initialSelectedDatasetId,
  );

  useEffect(() => {
    setSelectedDatasetId(initialSelectedDatasetId);
  }, [initialSelectedDatasetId]);

  const filteredDatasets = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return datasets;
    }

    return datasets.filter((dataset) => {
      const name = dataset.name.toLowerCase();
      const description = dataset.description?.toLowerCase() ?? "";
      return name.includes(keyword) || description.includes(keyword);
    });
  }, [datasets, searchKeyword]);

  const selectedDataset = useMemo(() => {
    if (selectedDatasetId === undefined) {
      return undefined;
    }

    return datasets.find((dataset) => dataset.id === selectedDatasetId);
  }, [datasets, selectedDatasetId]);

  const handleSelectDataset = useCallback((dataset: DatasetResponse) => {
    setSelectedDatasetId(dataset.id);
  }, []);

  const setSelectedDataset = useCallback((dataset?: DatasetResponse) => {
    setSelectedDatasetId(dataset?.id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDatasetId(undefined);
    setSearchKeyword("");
  }, []);

  return {
    datasets,
    filteredDatasets,
    isLoading,
    searchKeyword,
    setSearchKeyword,
    selectedDatasetId,
    selectedDataset,
    handleSelectDataset,
    setSelectedDataset,
    clearSelection,
  };
};
