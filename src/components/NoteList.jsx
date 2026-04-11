import NoteListItem from './NoteListItem';
import { useNotesStore } from '../store/useNotesStore';
import { ArchiveRestore, FileText, SearchX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/40 bg-line/10 shadow-sm">
              <ArchiveRestore size={26} className="text-muted/50" />
            </div>
            <p className="text-[13px] font-medium text-ink">Trash is empty</p>
            <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted/60">
              Notes you delete will stay here until you restore or permanently
              delete them.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/40 bg-line/10 shadow-sm">
              <FileText size={26} className="text-muted/50" />
            </div>
            <p className="text-[13px] font-medium text-ink">No notes yet</p>
            <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted/60">
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
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/40 bg-line/10 shadow-sm">
          <SearchX size={26} className="text-muted/50" />
        </div>
        <p className="text-[13px] font-medium text-ink">No results found</p>
        <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted/60">
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth px-3 py-3 md:px-4 md:py-4">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted/50">
          {summary}
        </p>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {activeTag ? (
            <span className="flex items-center gap-0.5 truncate rounded-lg bg-accent/8 px-2 py-0.5 text-[10px] font-medium text-accent">
              <span className="opacity-40">#</span>
              {activeTag}
            </span>
          ) : null}
          {searchQuery ? (
            <span className="truncate rounded-lg bg-line/30 px-2 py-0.5 text-[10px] font-medium text-muted/60">
              Search active
            </span>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-2 pb-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {notes.map((note) => (
            <motion.li
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.97, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
              <NoteListItem note={note} onSelect={onSelect} section={section} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export default NoteList;
