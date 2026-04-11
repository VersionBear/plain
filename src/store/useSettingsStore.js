import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      isOutlinePanelOpen: false,
      showInsightsPill: true,
      showFormattingToolbar: true,
      visibleInsights: {
        words: true,
        characters: true,
        readingTime: true,
        headings: true,
      },
      toggleOutlinePanel: () =>
        set((state) => ({ isOutlinePanelOpen: !state.isOutlinePanelOpen })),
      toggleInsightsPill: () =>
        set((state) => ({ showInsightsPill: !state.showInsightsPill })),
      toggleFormattingToolbar: () =>
        set((state) => ({ showFormattingToolbar: !state.showFormattingToolbar })),
      toggleVisibleInsight: (key) =>
        set((state) => ({
          visibleInsights: {
            ...state.visibleInsights,
            [key]: !state.visibleInsights[key],
          },
        })),
    }),
    {
      name: 'plain-settings',
    },
  ),
);
