import { useNotesStore } from '../store/useNotesStore';
import { formatEditorMeta } from '../utils/date';
import { PanelLeftClose, PanelLeftOpen, Pin, PinOff, Trash2, ArchiveRestore } from 'lucide-react';
import clsx from 'clsx';

function EditorHeader({ note, isSidebarCollapsed, onToggleSidebar, activeSection }) {
  const trashNote = useNotesStore((state) => state.trashNote);
  const restoreNote = useNotesStore((state) => state.restoreNote);
  const deleteNotePermanently = useNotesStore((state) => state.deleteNotePermanently);
  const togglePinned = useNotesStore((state) => state.togglePinned);
  const meta = formatEditorMeta(note.createdAt, note.updatedAt);

  return (
    <header className="sticky top-0 z-10 w-full flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-canvas/80 backdrop-blur-md border-b border-line">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 -ml-1.5 text-muted hover:text-ink hover:bg-line/50 rounded-lg transition-colors"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted">
            {activeSection === 'trash' ? 'In Trash' : 'Editing Note'}
          </span>
          <span className="text-[10px] text-muted/70">
            Updated {meta.updated}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {activeSection === 'notes' ? (
          <>
            <button
              type="button"
              title={note.pinned ? 'Unpin note' : 'Pin note'}
              onClick={() => togglePinned(note.id)}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                note.pinned ? "text-accent bg-accent/10" : "text-muted hover:text-ink hover:bg-line/50"
              )}
            >
              {note.pinned ? <PinOff size={18} /> : <Pin size={18} />}
            </button>
            <button
              type="button"
              title="Move to Trash"
              onClick={() => trashNote(note.id)}
              className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              title="Restore note"
              onClick={() => restoreNote(note.id)}
              className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
            >
              <ArchiveRestore size={18} />
            </button>
            <button
              type="button"
              title="Delete permanently"
              onClick={() => deleteNotePermanently(note.id)}
              className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default EditorHeader;