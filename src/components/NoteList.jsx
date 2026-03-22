import NoteListItem from './NoteListItem';
import { useNotesStore } from '../store/useNotesStore';

function NoteList({ notes, totalNotes, onSelect }) {
  const searchQuery = useNotesStore((state) => state.searchQuery);

  if (totalNotes === 0) {
    return (
      <div className="flex flex-1 items-end px-5 pb-8 pt-2 md:px-6">
        <div className="max-w-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Local-first by design</p>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-muted">
            A quiet place to keep notes close, without turning writing into a system.
          </p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center px-5 pb-8 pt-4 md:px-6">
        <div className="max-w-sm">
          <p className="font-serif text-2xl tracking-calm text-ink">Nothing matched that search.</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Try a simpler word or clear the search to return to your full list of notes.
          </p>
          {searchQuery ? (
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">Search is live</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[280px] flex-1 overflow-y-auto px-3 pb-4 md:px-4">
      <ul className="space-y-1.5">
        {notes.map((note) => (
          <li key={note.id}>
            <NoteListItem note={note} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NoteList;
