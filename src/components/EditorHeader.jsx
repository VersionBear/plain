import { useNotesStore } from '../store/useNotesStore';
import { formatEditorMeta } from '../utils/date';

function EditorHeader({ note }) {
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const togglePinned = useNotesStore((state) => state.togglePinned);
  const meta = formatEditorMeta(note.createdAt, note.updatedAt);

  return (
    <header className="border-b border-line/70 bg-panel/55 px-5 py-4 backdrop-blur md:px-8 md:py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex rounded-full border border-line/80 bg-elevated/70 px-2.5 py-1 uppercase tracking-[0.16em] text-muted">
              Private on this device
            </span>
            <span>Created {meta.created}</span>
            <span className="text-line">•</span>
            <span>Updated {meta.updated}</span>
          </div>
        </div>

        <div className="hairline inline-flex items-center gap-1 self-start rounded-full bg-elevated/75 p-1">
          <button
            type="button"
            onClick={() => togglePinned(note.id)}
            className={`rounded-full px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
              note.pinned
                ? 'bg-chrome text-ink'
                : 'text-muted hover:bg-panel/90 hover:text-ink'
            }`}
          >
            {note.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            type="button"
            onClick={() => deleteNote(note.id)}
            className="rounded-full bg-transparent px-3 py-2 text-sm text-muted transition hover:bg-panel/90 hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  );
}

export default EditorHeader;
