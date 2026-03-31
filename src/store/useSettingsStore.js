import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      isWriterMode: false,
      toggleWriterMode: () => set((state) => ({ isWriterMode: !state.isWriterMode })),
    }),
    {
      name: 'plain-settings',
    }
  )
);
