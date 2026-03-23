import { useNotesStore } from '../store/useNotesStore';
import { formatEditorMeta } from '../utils/date';

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.25 4.75h5.5" />
      <path d="M8 4.75v3.2l-2.5 2.1h9l-2.5-2.1v-3.2" />
      <path d="m10 10 0 5.25" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function EditorHeader({ note, isSidebarCollapsed, onToggleSidebar }) {
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const togglePinned = useNotesStore((state) => state.togglePinned);
  const meta = formatEditorMeta(note.createdAt, note.updatedAt);

  return (
    <header className="border-b border-line/70 bg-panel/35 px-4 py-2.5 backdrop-blur md:px-8 md:py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Show notes sidebar' : 'Hide notes sidebar'}
            aria-label={isSidebarCollapsed ? 'Show notes sidebar' : 'Hide notes sidebar'}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/80 bg-elevated/85 text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent md:inline-flex"
          >
            {isSidebarCollapsed ? (
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 4.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7" />
                <path d="M4.5 4.5v11" />
                <path d="m10.75 7.25-3 2.75 3 2.75" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 4.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7" />
                <path d="M4.5 4.5v11" />
                <path d="m9.25 7.25 3 2.75-3 2.75" />
              </svg>
            )}
          </button>

          <div className="min-w-0 text-[10px] text-muted md:flex md:flex-wrap md:items-center md:gap-x-2.5 md:gap-y-1 md:text-xs">
            <span className="hidden md:inline">Created {meta.created}</span>
            <span className="hidden text-line md:inline">•</span>
            <span className="block truncate">Updated {meta.updated}</span>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            title={note.pinned ? 'Unpin note' : 'Pin note'}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            onClick={() => togglePinned(note.id)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-accent md:h-10 md:w-10 ${
              note.pinned
                ? 'border-accent bg-accent/85 text-ink'
                : 'border-line/70 bg-transparent text-muted hover:border-line hover:bg-panel/75 hover:text-ink'
            }`}
          >
            <PinIcon />
          </button>
          <button
            type="button"
            title="Delete note"
            aria-label="Delete note"
            onClick={() => deleteNote(note.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-transparent text-muted transition hover:border-line hover:bg-panel/75 hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent md:h-10 md:w-10"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

export default EditorHeader;
