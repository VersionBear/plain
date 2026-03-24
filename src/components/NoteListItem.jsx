import { useNotesStore } from '../store/useNotesStore';
import { formatNoteTimestamp, formatTrashTimestamp } from '../utils/date';
import { getNotePreview, getNoteTitle } from '../utils/notes';

function NoteListItem({ note, onSelect, section }) {
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const selectNote = useNotesStore((state) => state.selectNote);
  const isSelected = selectedNoteId === note.id;

  return (
    <button
      type="button"
      onClick={() => {
        selectNote(note.id);
        onSelect?.(note.id);
      }}
      className={`group relative w-full rounded-[20px] border px-4 py-3.5 text-left transition ${
        isSelected
          ? 'border-accent/90 bg-elevated shadow-selected'
          : note.pinned
            ? 'border-transparent bg-pin/80 hover:border-line/70 hover:bg-elevated/80'
            : 'border-transparent bg-transparent hover:border-line/60 hover:bg-elevated/55'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-3 left-1.5 w-[3px] rounded-full transition ${
          isSelected ? 'bg-ink/40' : 'bg-transparent group-hover:bg-line/80'
        }`}
      />
      <div className="flex items-start justify-between gap-4">
        <p className="line-clamp-1 pr-2 text-sm font-medium text-ink">{getNoteTitle(note)}</p>
        <div className="flex shrink-0 items-center gap-2 self-start text-xs text-muted">
          {section === 'notes' && note.pinned ? (
            <span
              aria-label="Pinned note"
              title="Pinned note"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-canvas/85 text-muted"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-3.5 w-3.5"
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
            </span>
          ) : null}
          <p>{section === 'trash' ? formatTrashTimestamp(note.trashedAt ?? note.updatedAt) : formatNoteTimestamp(note.updatedAt)}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{getNotePreview(note)}</p>
      {section === 'trash' ? (
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">In Trash</p>
      ) : null}
    </button>
  );
}

export default NoteListItem;
