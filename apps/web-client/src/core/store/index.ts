import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'app-storage',
      }
    ),
    {
      name: 'app-store',
    }
  )
);

export default useAppStore;
