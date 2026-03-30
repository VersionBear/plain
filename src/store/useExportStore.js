import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultSettings = {
  darkMode: false,
  includeMetadata: true,
  lastFormat: 'markdown',
  formatSettings: {
    markdown: { includeMetadata: true },
    text: {},
    html: { darkMode: false },
    png: { scale: 2, darkMode: false },
    jpeg: { scale: 2, darkMode: false, quality: 0.95 },
    pdf: { scale: 2, darkMode: false },
  },
};

export const useExportStore = create(
  persist(
    (set) => ({
      settings: defaultSettings,
      isExportModalOpen: false,
      selectedNoteId: null,
      exportProgress: null,
      openExportModal: (noteId) =>
        set({
          isExportModalOpen: true,
          selectedNoteId: noteId,
          exportProgress: null,
        }),
      closeExportModal: () =>
        set({
          isExportModalOpen: false,
          selectedNoteId: null,
          exportProgress: null,
        }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            formatSettings: {
              ...state.settings.formatSettings,
              ...(newSettings.formatSettings || {}),
            },
          },
        })),
      setFormatSetting: (format, key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            formatSettings: {
              ...state.settings.formatSettings,
              [format]: {
                ...state.settings.formatSettings[format],
                [key]: value,
              },
            },
          },
        })),
      setLastFormat: (format) =>
        set((state) => ({
          settings: {
            ...state.settings,
            lastFormat: format,
          },
        })),
      updateProgress: (progress) => set({ exportProgress: progress }),
      resetProgress: () => set({ exportProgress: null }),
    }),
    {
      name: 'plain-export-settings',
      version: 2,
      partialize: (state) => ({ settings: state.settings }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        settings: {
          ...defaultSettings,
          ...(persistedState?.settings || {}),
          formatSettings: {
            ...defaultSettings.formatSettings,
            ...(persistedState?.settings?.formatSettings || {}),
          },
        },
      }),
    },
  ),
);
