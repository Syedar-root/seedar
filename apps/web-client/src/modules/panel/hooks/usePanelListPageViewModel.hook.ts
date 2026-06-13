import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeletePanel, usePanels, useUpdatePanel } from "#pkg/seedar/ui-react";
import { PanelStatus } from "#pkg/seedar/types";

interface PanelListItem {
  id: string;
  title?: string;
  status: PanelStatus;
  createdAt: string | Date;
  datasetName?: string;
}

interface UsePanelListPageViewModelReturn {
  isLoading: boolean;
  filteredPanels: PanelListItem[];
  searchInput: string;
  statusFilter: string;
  datasetFilter: string;
  handleSearchChange: (value: string) => void;
  handleSearchCompositionStart: () => void;
  handleSearchCompositionEnd: (value: string) => void;
  handleStatusFilterChange: (value: string) => void;
  handleDatasetFilterChange: (value: string) => void;
  handleCreatePanel: () => void;
  handleOpenPanel: (panelId: string) => void;
  handleStatusToggle: (panel: { id: string; status: PanelStatus }) => void;
  handleDelete: (id: string) => void;
}

export const usePanelListPageViewModel = (): UsePanelListPageViewModelReturn => {
  const navigate = useNavigate();
  const { data: panels, isLoading } = usePanels();
  const updatePanel = useUpdatePanel();
  const deletePanel = useDeletePanel();

  const [searchInput, setSearchInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [datasetFilter, setDatasetFilter] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (!isComposing) {
      setSearchQuery(value);
    }
  };

  const handleSearchCompositionStart = () => {
    setIsComposing(true);
  };

  const handleSearchCompositionEnd = (value: string) => {
    setIsComposing(false);
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleDatasetFilterChange = (value: string) => {
    setDatasetFilter(value);
  };

  const handleCreatePanel = () => {
    navigate("/panel/create");
  };

  const handleOpenPanel = (panelId: string) => {
    navigate(`/panel/${panelId}`);
  };

  const filteredPanels = useMemo(() => {
    return (
      panels?.filter((panel) => {
        const matchTitle =
          !searchQuery ||
          panel.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = !statusFilter || panel.status === statusFilter;
        const matchDataset =
          !datasetFilter ||
          panel.datasetName
            ?.toLowerCase()
            .includes(datasetFilter.toLowerCase());
        return matchTitle && matchStatus && matchDataset;
      }) ?? []
    );
  }, [panels, searchQuery, statusFilter, datasetFilter]);

  const handleStatusToggle = (panel: { id: string; status: PanelStatus }) => {
    const newStatus =
      panel.status === PanelStatus.DRAFT
        ? PanelStatus.PUBLISHED
        : PanelStatus.DRAFT;
    updatePanel.mutate({ id: panel.id, data: { status: newStatus } });
  };

  const handleDelete = (id: string) => {
    deletePanel.mutate(id);
  };

  return {
    isLoading,
    filteredPanels,
    searchInput,
    statusFilter,
    datasetFilter,
    handleSearchChange,
    handleSearchCompositionStart,
    handleSearchCompositionEnd,
    handleStatusFilterChange,
    handleDatasetFilterChange,
    handleCreatePanel,
    handleOpenPanel,
    handleStatusToggle,
    handleDelete,
  };
};