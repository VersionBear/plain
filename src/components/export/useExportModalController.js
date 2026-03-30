import { useCallback, useEffect, useRef } from 'react';

export function useExportModalController({
  closeExportModal,
  isExportModalOpen,
  selectedFormat,
  selectedNote,
  setExportError,
  setIsExporting,
  setLastFormat,
  setSelectedFormat,
  setShowSettings,
  settings,
  updateProgress,
  resetProgress,
}) {
  const modalRef = useRef(null);

  const handleExport = useCallback(async () => {
    if (!selectedNote) {
      return;
    }

    setIsExporting(true);
    setExportError(null);
    resetProgress();

    const formatSettings = settings.formatSettings[selectedFormat] || {};
    const options = {
      ...formatSettings,
      darkMode: settings.darkMode,
    };

    try {
      const { exportNoteWithProgress } = await import('../../utils/export');

      await exportNoteWithProgress(
        selectedNote,
        selectedFormat,
        options,
        (progress) => {
          updateProgress(progress);
        },
      );

      setLastFormat(selectedFormat);

      setTimeout(() => {
        closeExportModal();
      }, 800);
    } catch (error) {
      setExportError(error.message || 'Failed to export');
      updateProgress({ stage: 'error', progress: 0, error });
    } finally {
      setIsExporting(false);
    }
  }, [
    closeExportModal,
    resetProgress,
    selectedFormat,
    selectedNote,
    setExportError,
    setIsExporting,
    setLastFormat,
    settings.darkMode,
    settings.formatSettings,
    updateProgress,
  ]);

  useEffect(() => {
    if (!isExportModalOpen) {
      return;
    }

    setSelectedFormat(settings.lastFormat || 'markdown');
    setShowSettings(false);
    setExportError(null);
  }, [
    isExportModalOpen,
    setExportError,
    setSelectedFormat,
    setShowSettings,
    settings.lastFormat,
  ]);

  return { handleExport, modalRef };
}
