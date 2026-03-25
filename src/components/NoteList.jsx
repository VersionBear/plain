import NoteListItem from './NoteListItem';
import { useNotesStore } from '../store/useNotesStore';
import { ArchiveRestore, FileText, SearchX } from 'lucide-react';

function NoteList({ notes, totalNotes, onSelect, section }) {
  const searchQuery = useNotesStore((state) => state.searchQuery);

  if (totalNotes === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
        {section === 'trash' ? (
          <>
            <div className="bg-line/30 p-3 rounded-full mb-3">
              <ArchiveRestore size={24} className="opacity-70" />
            </div>
            <p className="text-sm font-medium text-ink">Trash is empty</p>
            <p className="text-xs mt-1 max-w-[200px] leading-relaxed">
              Notes you delete will stay here until you restore or permanently delete them.
            </p>
          </>
        ) : (
          <>
            <div className="bg-line/30 p-3 rounded-full mb-3">
              <FileText size={24} className="opacity-70" />
            </div>
            <p className="text-sm font-medium text-ink">Local-first notes</p>
            <p className="text-xs mt-1 max-w-[200px] leading-relaxed">
              A quiet place to keep notes close, without turning writing into a system.
            </p>
          </>
        )}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
        <div className="bg-line/30 p-3 rounded-full mb-3">
          <SearchX size={24} className="opacity-70" />
        </div>
        <p className="text-sm font-medium text-ink">No results found</p>
        <p className="text-xs mt-1 max-w-[200px] leading-relaxed">
          Try a different keyword or clear your search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth">
      <ul className="flex flex-col gap-1">
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