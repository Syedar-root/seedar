import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AiChatScene } from "#pkg/seedar/types";

interface AIChatScenesState {
  scenes: AiChatScene[];
  setScenes: (scenes: AiChatScene[]) => void;
  clearScenes: () => void;
}

export const useAiChatScenesStore = create<AIChatScenesState>()(
  devtools(
    (set) => ({
      scenes: [],
      setScenes: (scenes) => set({ scenes }),
      clearScenes: () => set({ scenes: [] }),
    }),
    {
      name: "ai-chat-scenes-store",
    },
  ),
);

export default useAiChatScenesStore;
