import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isSeeMindOn: boolean;
  toggleSeeMind: () => void;
  setSeeMind: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        setLoading: (loading) => set({ isLoading: loading }),
        isSeeMindOn: false,
        toggleSeeMind: () => set((state) => ({ isSeeMindOn: !state.isSeeMindOn })),
        setSeeMind: (value) => set({ isSeeMindOn: value }),
      }),
      {
        name: 'seedar-app-storage',
      },
    ),
    {
      name: 'seedar-app-store',
    },
  ),
);

export default useAppStore;
