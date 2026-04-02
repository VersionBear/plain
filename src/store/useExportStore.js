import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const defaultExportSettings = {
  darkMode: false,
  includeMetadata: true,
  lastFormat: 'markdown',
  formatSettings: {
    markdown: { includeMetadata: true },
    text: {},
    html: {
      darkMode: false,
      includeTitle: true,
      pageWidth: 'comfortable',
    },
    png: { scale: 2, darkMode: false },
    jpeg: { scale: 2, darkMode: false, quality: 0.95 },
    pdf: {
      scale: 2,
      darkMode: false,
      pageFormat: 'a4',
      orientation: 'portrait',
      margin: 'standard',
      includeTitle: true,
      pageNumbers: false,
    },
  },
};

export function mergeExportSettings(persistedSettings = {}) {
  const mergedSettings = {
    ...defaultExportSettings,
    ...persistedSettings,
    formatSettings: {
      ...defaultExportSettings.formatSettings,
    },
  };
  const persistedFormatSettings = persistedSettings?.formatSettings || {};

  for (const [formatId, formatDefaults] of Object.entries(
    defaultExportSettings.formatSettings,
  )) {
    mergedSettings.formatSettings[formatId] = {
      ...formatDefaults,
      ...(persistedFormatSettings[formatId] || {}),
    };
  }

  for (const [formatId, formatSettings] of Object.entries(
    persistedFormatSettings,
  )) {
    if (!mergedSettings.formatSettings[formatId]) {
      mergedSettings.formatSettings[formatId] = formatSettings;
    }
  }

  return mergedSettings;
}

export const useExportStore = create(
  persist(
    (set) => ({
      settings: defaultExportSettings,
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
      version: 3,
      partialize: (state) => ({ settings: state.settings }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        settings: mergeExportSettings(persistedState?.settings),
      }),
    },
  ),
);
