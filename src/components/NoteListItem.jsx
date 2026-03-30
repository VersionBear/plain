import { useNotesStore } from '../store/useNotesStore';
import { formatNoteTimestamp, formatTrashTimestamp } from '../utils/date';
import { getNotePreview, getNoteTitle, getNoteTags } from '../utils/notes';
import { Pin } from 'lucide-react';
import clsx from 'clsx';

function NoteListItem({ note, onSelect, section }) {
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const selectNote = useNotesStore((state) => state.selectNote);
  const activeTag = useNotesStore((state) => state.activeTag);
  const isSelected = selectedNoteId === note.id;
  const tags = getNoteTags(note);
  const visibleTags = activeTag
    ? tags.filter((tag) => tag === activeTag)
    : isSelected
      ? tags
      : [];

  return (
    <div
      className={clsx(
        'group relative flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition-all duration-200',
        isSelected
          ? 'border-line bg-elevated shadow-selected'
          : 'border-transparent bg-transparent hover:border-line/50 hover:bg-line/25',
      )}
    >
      {isSelected ? (
        <span
          className="absolute bottom-3 left-1 top-3 w-0.5 rounded-full bg-accent/70"
          aria-hidden="true"
        />
      ) : null}
      <button
        type="button"
        onClick={() => {
          selectNote(note.id);
          onSelect?.(note.id);
        }}
        aria-label={`Select note: ${getNoteTitle(note)}`}
        aria-pressed={isSelected}
        className="w-full text-left"
      >
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3
            className={clsx(
              'flex-1 truncate text-base font-semibold tracking-tight',
              isSelected ? 'text-ink' : 'text-ink/90 group-hover:text-ink',
            )}
          >
            {getNoteTitle(note)}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {section === 'notes' && note.pinned && (
              <Pin size={12} className="fill-accent/20 text-accent" />
            )}
            <span className="whitespace-nowrap text-xs text-muted">
              {section === 'trash'
                ? formatTrashTimestamp(note.trashedAt ?? note.updatedAt)
                : formatNoteTimestamp(note.updatedAt)}
            </span>
          </div>
        </div>
        <p className="line-clamp-2 text-[14px] leading-relaxed text-muted opacity-80 transition-opacity group-hover:opacity-100 md:line-clamp-3">
          {getNotePreview(note)}
        </p>
      </button>
      {visibleTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className={clsx(
                'inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-medium',
                activeTag === tag
                  ? 'bg-accent/10 text-accent'
                  : 'bg-line/30 text-muted',
              )}
            >
              <span className="opacity-50">#</span>
              <span>{tag}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default NoteListItem;
