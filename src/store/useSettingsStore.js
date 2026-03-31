import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      isWriterMode: false,
      isZenMode: false,
      isCompactMode: false,
      isWideMode: false,
      toggleWriterMode: () => set((state) => ({ isWriterMode: !state.isWriterMode })),
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
      toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),
      toggleWideMode: () => set((state) => ({ isWideMode: !state.isWideMode })),
    }),
    {
      name: 'plain-settings',
    }
  )
);
