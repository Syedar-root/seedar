import { create } from "zustand";
import { DatasourceApi } from "#pkg/seedar/ui-core";
import type { DatasourceResponse } from "#pkg/seedar/types";

interface DatasetEditorState {
  datasourceId: number | null;
  datasource: DatasourceResponse | null;
  isLoading: boolean;
  error: Error | null;
  setDatasourceId: (id: number | null) => void;
  fetchDatasource: (id: number) => Promise<void>;
  clear: () => void;
}

export const useDatasetEditorStore = create<DatasetEditorState>((set) => ({
  datasourceId: null,
  datasource: null,
  isLoading: false,
  error: null,

  setDatasourceId: (id) => set({ datasourceId: id }),

  fetchDatasource: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await DatasourceApi.findOne(id);
      set({ datasource: data, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  clear: () => set({ datasourceId: null, datasource: null, error: null }),
}));
