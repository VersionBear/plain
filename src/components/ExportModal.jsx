import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import FormatList from './export/FormatList';
import ExportFooter from './export/ExportFooter';
import FormatSettingsPanel from './export/FormatSettingsPanel';
import { formatIcons } from './export/formatIcons';
import { useExportModalController } from './export/useExportModalController';
import { useExportStore } from '../store/useExportStore';
import { useNotesStore } from '../store/useNotesStore';
import { useFoundersStore } from '../store/useFoundersStore';
import { getExportFormats } from '../utils/exportFormats';
import { useOverlayFocus } from '../hooks/useOverlayFocus';

function ExportModal() {
  const {
    closeExportModal,
    exportProgress,
    isExportModalOpen,
    resetProgress,
    selectedNoteId,
    setFormatSetting,
    setLastFormat,
    settings,
    updateProgress,
    updateSettings,
  } = useExportStore();
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const titleId = useId();
  const descriptionId = useId();
  const hasEarlyAccess = useFoundersStore((state) => state.hasEarlyAccess);
  const formats = getExportFormats();
  const currentFormat = formats.find((format) => format.id === selectedFormat);
  const selectedNote = useMemo(
    () =>
      [...notes, ...trashedNotes].find((note) => note.id === selectedNoteId) ??
      null,
    [notes, selectedNoteId, trashedNotes],
  );
  const groupedFormats = useMemo(
    () =>
      formats.reduce((accumulator, format) => {
        // Gate Premium formats behind hasEarlyAccess
        if (['pdf', 'docx', 'epub'].includes(format.id) && !hasEarlyAccess) {
          return accumulator;
        }

        if (!accumulator[format.category]) {
          accumulator[format.category] = [];
        }

        accumulator[format.category].push(format);
        return accumulator;
      }, {}),
    [formats, hasEarlyAccess],
  );

  const { handleExport, modalRef } = useExportModalController({
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
  });

  useOverlayFocus({
    isOpen: isExportModalOpen && Boolean(selectedNote),
    containerRef: modalRef,
    onClose: closeExportModal,
    canClose: !isExporting,
  });

  const getFormatSetting = (key, defaultValue) => {
    const formatSettings = settings.formatSettings[selectedFormat] || {};
    return formatSettings[key] ?? defaultValue;
  };

  if (!isExportModalOpen || !selectedNote) {
    return null;
  }

  const SelectedFormatIcon = formatIcons[selectedFormat];

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="export-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={() => !isExporting && closeExportModal()}
      />
      <motion.div
        key="export-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-0 md:p-4"
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="pointer-events-auto flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-panel shadow-2xl md:max-h-[90vh] md:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/50 px-4 py-4 md:px-6">
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="truncate text-base font-semibold text-ink md:text-lg"
              >
                Export Note
              </h2>
              <p
                id={descriptionId}
                className="mt-0.5 truncate text-xs text-muted md:text-sm"
              >
                {selectedNote.title || 'Untitled note'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => !isExporting && closeExportModal()}
              aria-label="Close export dialog"
              className="ml-2 shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
              disabled={isExporting}
            >
              <X size={18} className="md:size-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            <FormatList
              formatIcons={formatIcons}
              groupedFormats={groupedFormats}
              isExporting={isExporting}
              selectedFormat={selectedFormat}
              setSelectedFormat={setSelectedFormat}
              setShowSettings={setShowSettings}
              showSettings={showSettings}
            />
            <div
              className={clsx(
                'flex min-w-0 flex-1 flex-col overflow-hidden',
                showSettings
                  ? 'absolute inset-0 z-10 flex bg-panel md:static'
                  : 'hidden md:flex',
              )}
            >
              <FormatSettingsPanel
                currentFormat={currentFormat}
                formatIcon={
                  SelectedFormatIcon ? (
                    <SelectedFormatIcon size={18} className="text-accent" />
                  ) : null
                }
                getFormatSetting={getFormatSetting}
                selectedFormat={selectedFormat}
                setFormatSetting={setFormatSetting}
                settings={settings}
                setShowSettings={setShowSettings}
                updateSettings={updateSettings}
              />
              <ExportFooter
                currentFormat={currentFormat}
                exportError={exportError}
                exportProgress={exportProgress}
                handleExport={handleExport}
                isExporting={isExporting}
                setShowSettings={setShowSettings}
                showSettings={showSettings}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default ExportModal;
