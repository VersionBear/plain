import { useNotesStore } from '../store/useNotesStore';
import { formatNoteTimestamp, formatTrashTimestamp } from '../utils/date';
import { getNotePreview, getNoteTitle } from '../utils/notes';
import { Pin } from 'lucide-react';
import clsx from 'clsx';

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
      className={clsx(
        "group relative w-full flex flex-col text-left px-4 py-3 rounded-xl transition-all duration-200 border",
        isSelected
          ? "bg-elevated border-line shadow-selected"
          : "bg-transparent border-transparent hover:bg-line/40"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className={clsx(
          "font-medium text-sm truncate flex-1",
          isSelected ? "text-ink" : "text-ink/90 group-hover:text-ink"
        )}>
          {getNoteTitle(note)}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {section === 'notes' && note.pinned && (
            <Pin size={12} className="text-accent fill-accent/20" />
          )}
          <span className="text-[11px] text-muted whitespace-nowrap">
            {section === 'trash' ? formatTrashTimestamp(note.trashedAt ?? note.updatedAt) : formatNoteTimestamp(note.updatedAt)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
        {getNotePreview(note)}
      </p>
    </button>
  );
}

export default NoteListItem;