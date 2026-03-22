import { useNotesStore } from '../store/useNotesStore';
import { formatNoteTimestamp } from '../utils/date';
import { getNotePreview, getNoteTitle } from '../utils/notes';

function NoteListItem({ note, onSelect }) {
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
        <div className="shrink-0 text-right">
          {note.pinned ? (
            <span className="mb-1 inline-flex rounded-full bg-canvas/85 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
              Pinned
            </span>
          ) : null}
          <p className="text-xs text-muted">{formatNoteTimestamp(note.updatedAt)}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{getNotePreview(note)}</p>
    </button>
  );
}

export default NoteListItem;
