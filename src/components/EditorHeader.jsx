import { useEffect, useState } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { formatEditorMeta } from '../utils/date';
import ConfirmDialog from './common/ConfirmDialog';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Trash2,
  ArchiveRestore,
  Download,
  CheckCircle2,
  List,
} from 'lucide-react';
import clsx from 'clsx';
import { useSettingsStore } from '../store/useSettingsStore';
import { motion } from 'framer-motion';
import { serializeNoteToMarkdown } from '../utils/noteMarkdown';

function EditorHeader({
  note,
  isSidebarCollapsed,
  onToggleSidebar,
  activeSection,
}) {
  const trashNote = useNotesStore((state) => state.trashNote);
  const restoreNote = useNotesStore((state) => state.restoreNote);
  const deleteNotePermanently = useNotesStore(
    (state) => state.deleteNotePermanently,
  );
  const togglePinned = useNotesStore((state) => state.togglePinned);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const isOutlinePanelOpen = useSettingsStore((state) => state.isOutlinePanelOpen);
  const toggleOutlinePanel = useSettingsStore((state) => state.toggleOutlinePanel);
  const meta = note ? formatEditorMeta(note.createdAt, note.updatedAt) : null;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [savePulse, setSavePulse] = useState(false);

  const saveLocationCopy =
    activeSection === 'trash'
      ? 'Read-only · Trash'
      : storageStatus.hasFolderConnection
        ? 'Saved to folder'
        : storageStatus.supportsFolderPicker
          ? 'Saved locally'
          : 'Browser storage';

  useEffect(() => {
    if (note?.updatedAt) {
      setSavePulse(true);
      const timer = window.setTimeout(() => setSavePulse(false), 2000);
      return () => window.clearTimeout(timer);
    }
  }, [note?.updatedAt]);

  const handleExportClick = () => {
    if (!note) return;

    try {
      const markdown = serializeNoteToMarkdown(note);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = (note.title || 'Untitled')
        .replace(/[<>/\\|?*]/g, '-')
        .trim();
        
      link.href = url;
      link.download = `${fileName}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage('Note exported!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      setExportMessage('Export failed.');
      console.error('Export error:', error);
      setTimeout(() => setExportMessage(''), 3000);
    }
  };

  const buttonVariants = {
    hover: { scale: 1.08 },
    tap: { scale: 0.92 },
  };

  const buttonTransition = {
    type: "spring",
    stiffness: 400,
    damping: 25,
  };

  return (
    <>
      <div className="z-20 w-full sticky top-0">
        <div className="absolute inset-x-0 top-0 h-4 hidden" />
        <header className="flex w-full items-center justify-between border-b border-line/40 bg-canvas/85 px-3 py-2 backdrop-blur-xl transition-all duration-300 md:px-6 md:py-2.5 translate-y-0 opacity-100">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={onToggleSidebar}
              aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              whileTap={buttonVariants.tap}
              transition={buttonTransition}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/70 transition-colors hover:bg-line/30 hover:text-ink md:flex md:-ml-1.5 md:h-auto md:w-auto md:rounded-2xl md:p-1.5"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </motion.button>

            <div className="flex items-center gap-2 px-2 py-1 bg-line/10 rounded-xl border border-line/5">
              <div className="flex items-center gap-1.5 px-0.5">
                {activeSection !== 'trash' && (
                  <motion.div
                    animate={{
                      scale: savePulse ? 1.2 : 1,
                    }}
                    transition={{
                      duration: 0.6,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <CheckCircle2
                      size={12}
                      className={clsx(
                        "transition-colors duration-700",
                        savePulse ? "text-emerald-500" : "text-emerald-500/40"
                      )}
                    />
                  </motion.div>
                )}
                <span className="text-[11px] font-bold tracking-tight text-muted/80 uppercase">
                  {saveLocationCopy}
                </span>
              </div>
              {meta ? (
                <>
                  <span className="h-3 w-px bg-line/20" />
                  <span className="text-[11px] font-medium text-muted/40 px-0.5">
                    {meta.updated}
                  </span>
                </>
              ) : null}
              {exportMessage ? (
                <>
                  <span className="h-3 w-px bg-line/20" />
                  <motion.span
                    aria-live="polite"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-0.5"
                  >
                    {exportMessage}
                  </motion.span>
                </>
              ) : null}
            </div>
          </div>

          {note ? (
            <div className="flex items-center gap-1 p-1 bg-line/10 rounded-2xl border border-line/5">
              {activeSection === 'notes' ? (
                <>
                  <motion.button
                    type="button"
                    title={isOutlinePanelOpen ? 'Hide outline panel' : 'Show outline panel'}
                    aria-label="Toggle outline panel"
                    onClick={toggleOutlinePanel}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className={clsx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                      isOutlinePanelOpen
                        ? 'bg-elevated text-accent shadow-sm'
                        : 'text-muted/70 hover:bg-line/20 hover:text-ink',
                    )}
                  >
                    <List size={17} />
                  </motion.button>

                  <motion.button
                    type="button"
                    title="Export note"
                    aria-label="Export note"
                    onClick={handleExportClick}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/70 transition-all hover:bg-line/20 hover:text-ink"
                  >
                    <Download size={17} />
                  </motion.button>

                  <motion.button
                    type="button"
                    title={note.pinned ? 'Unpin note' : 'Pin note'}
                    aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    onClick={() => togglePinned(note.id)}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className={clsx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                      note.pinned
                        ? 'bg-elevated text-accent shadow-sm'
                        : 'text-muted/70 hover:bg-line/20 hover:text-ink',
                    )}
                  >
                    <motion.div
                      animate={{ rotate: note.pinned ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {note.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                    </motion.div>
                  </motion.button>
                  <motion.button
                    type="button"
                    title="Move to Trash"
                    aria-label="Move note to trash"
                    onClick={() => trashNote(note.id)}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/70 transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={17} />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    type="button"
                    title="Restore note"
                    aria-label="Restore note"
                    onClick={() => restoreNote(note.id)}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/70 transition-all hover:bg-accent/10 hover:text-accent"
                  >
                    <ArchiveRestore size={17} />
                  </motion.button>
                  <motion.button
                    type="button"
                    title="Delete permanently"
                    aria-label="Delete note permanently"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    whileTap={buttonVariants.tap}
                    transition={buttonTransition}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/70 transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={17} />
                  </motion.button>
                </>
              )}
            </div>
          ) : null}
        </header>
      </div>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete note forever?"
        description="This removes the note from Trash for good. Restore it instead if you may need it later."
        confirmLabel="Delete forever"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => void deleteNotePermanently(note?.id)}
      />
    </>
  );
}

export default EditorHeader;
