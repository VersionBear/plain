import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      isWriterMode: false,
      isZenMode: false,
      isCompactMode: false,
      isWideMode: false,
      isOutlinePanelOpen: true,
      showInsightsPill: true,
      toggleWriterMode: () =>
        set((state) => ({ isWriterMode: !state.isWriterMode })),
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
      toggleCompactMode: () =>
        set((state) => ({ isCompactMode: !state.isCompactMode })),
      toggleWideMode: () => set((state) => ({ isWideMode: !state.isWideMode })),
      toggleOutlinePanel: () =>
        set((state) => ({ isOutlinePanelOpen: !state.isOutlinePanelOpen })),
      toggleInsightsPill: () =>
        set((state) => ({ showInsightsPill: !state.showInsightsPill })),
    }),
    {
      name: 'plain-settings',
    },
  ),
);
