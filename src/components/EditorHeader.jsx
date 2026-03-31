import { useRef, useState } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useExportStore } from '../store/useExportStore';
import { formatEditorMeta } from '../utils/date';
import ConfirmDialog from './common/ConfirmDialog';
import ViewOptions from './editor/ViewOptions';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Trash2,
  ArchiveRestore,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { useSettingsStore } from '../store/useSettingsStore';

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
  const openExportModal = useExportStore((state) => state.openExportModal);
  const isZenMode = useSettingsStore((state) => state.isZenMode);
  const meta = note ? formatEditorMeta(note.createdAt, note.updatedAt) : null;
  const exportButtonRef = useRef(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  return (
    <>
      <div className={clsx('z-20 w-full', isZenMode ? 'group absolute left-0 right-0 top-0' : 'sticky top-0')}>
        <div className={clsx('absolute inset-x-0 top-0 h-4', isZenMode ? 'block' : 'hidden')} />
        <header
          className={clsx(
            'flex w-full items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-md transition-all duration-300 md:px-6 md:py-4',
            isZenMode
              ? '-translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100'
              : 'translate-y-0 opacity-100'
          )}
        >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            className="-ml-1.5 hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:flex"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted">
              {activeSection === 'trash' ? 'In Trash' : 'Notes'}
            </span>
            {meta ? (
              <span className="text-[10px] text-muted/70">
                Updated {meta.updated}
              </span>
            ) : null}
          </div>
        </div>

        {note ? (
          <div className="flex items-center gap-1">
            {activeSection === 'notes' ? (
              <>
                <ViewOptions />

                <button
                  ref={exportButtonRef}
                  type="button"
                  title="Export note"
                  aria-label="Export note"
                onClick={() => openExportModal(note.id)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <Download size={18} />
              </button>

              <button
                type="button"
                title={note.pinned ? 'Unpin note' : 'Pin note'}
                aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                onClick={() => togglePinned(note.id)}
                className={clsx(
                  'rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                  note.pinned
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-line/50 hover:text-ink',
                )}
              >
                {note.pinned ? <PinOff size={18} /> : <Pin size={18} />}
              </button>
              <button
                type="button"
                title="Move to Trash"
                aria-label="Move note to trash"
                onClick={() => trashNote(note.id)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                title="Restore note"
                aria-label="Restore note"
                onClick={() => restoreNote(note.id)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <ArchiveRestore size={18} />
              </button>
              <button
                type="button"
                title="Delete permanently"
                aria-label="Delete note permanently"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
        ) : null}
        </header>
      </div>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete note permanently?"
        description="This note will be removed from Trash and cannot be restored afterward."
        confirmLabel="Delete forever"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => void deleteNotePermanently(note?.id)}
      />
    </>
  );
}

export default EditorHeader;
