import NoteListItem from './NoteListItem';
import { useNotesStore } from '../store/useNotesStore';
import { ArchiveRestore, FileText, SearchX } from 'lucide-react';

function getListSummary({
  notesLength,
  totalNotes,
  section,
  searchQuery,
  activeTag,
}) {
  if (section === 'trash') {
    return totalNotes === 1
      ? '1 note in trash'
      : `${totalNotes} notes in trash`;
  }

  if (searchQuery || activeTag) {
    return `Showing ${notesLength} of ${totalNotes}`;
  }

  return totalNotes === 1 ? '1 note' : `${totalNotes} notes`;
}

function NoteList({ notes, totalNotes, onSelect, section }) {
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const activeTag = useNotesStore((state) => state.activeTag);

  if (totalNotes === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted">
        {section === 'trash' ? (
          <>
            <div className="mb-3 rounded-full bg-line/30 p-3">
              <ArchiveRestore size={22} className="opacity-70" />
            </div>
            <p className="text-sm font-medium text-ink">Trash is empty</p>
            <p className="mt-1 max-w-[200px] text-xs leading-relaxed">
              Notes you delete will stay here until you restore or permanently
              delete them.
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 rounded-full bg-line/30 p-3">
              <FileText size={22} className="opacity-70" />
            </div>
            <p className="text-sm font-medium text-ink">No notes yet</p>
            <p className="mt-1 max-w-[200px] text-xs leading-relaxed">
              Start a note and keep it close, without turning writing into a
              system.
            </p>
          </>
        )}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted">
        <div className="mb-3 rounded-full bg-line/30 p-3">
          <SearchX size={22} className="opacity-70" />
        </div>
        <p className="text-sm font-medium text-ink">No results found</p>
        <p className="mt-1 max-w-[200px] text-xs leading-relaxed">
          {section === 'notes' && activeTag
            ? `Try a different keyword or clear the #${activeTag} filter.`
            : 'Try a different keyword or clear your search.'}
        </p>
      </div>
    );
  }

  const summary = getListSummary({
    notesLength: notes.length,
    totalNotes,
    section,
    searchQuery,
    activeTag,
  });

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth px-3 py-3">
      <div className="sticky top-0 z-[1] mb-3 flex items-center justify-between gap-2 rounded-2xl border border-line/70 bg-panel/85 px-3 py-2 backdrop-blur">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {summary}
        </p>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {activeTag ? (
            <span className="flex items-center gap-0.5 truncate rounded-md bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent">
              <span className="opacity-50">#</span>
              {activeTag}
            </span>
          ) : null}
          {searchQuery ? (
            <span className="truncate rounded-md bg-line/40 px-2 py-1 text-[10px] font-medium text-muted">
              Search active
            </span>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {notes.map((note) => (
          <li key={note.id}>
            <NoteListItem note={note} onSelect={onSelect} section={section} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NoteList;
