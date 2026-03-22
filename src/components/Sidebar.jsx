import NoteList from './NoteList';
import SearchInput from './SearchInput';
import { useNotesStore } from '../store/useNotesStore';

function Sidebar({
  notes,
  totalNotes,
  theme,
  toggleTheme,
  onCreateNote,
  onNoteSelect,
  isMobileOpen,
  onCloseMobile,
}) {
  const createNote = useNotesStore((state) => state.createNote);
  const handleCreateNote = onCreateNote ?? createNote;

  const sidebarContent = (
    <>
      <div className="border-b border-line/80 px-5 pb-4 pt-6 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl tracking-calm text-ink">Plain</p>
            <p className="mt-1 text-sm text-muted">No accounts. No plugins. Just notes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="hairline inline-flex h-10 w-10 items-center justify-center rounded-full bg-elevated/90 text-muted transition hover:bg-elevated hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {theme === 'dark' ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="10" cy="10" r="3.5" />
                  <path d="M10 2.5v2.2M10 15.3v2.2M17.5 10h-2.2M4.7 10H2.5M15.3 4.7l-1.5 1.5M6.2 13.8l-1.5 1.5M15.3 15.3l-1.5-1.5M6.2 6.2L4.7 4.7" strokeLinecap="round" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M11.7 2.7a.7.7 0 0 0-.8.8 6.2 6.2 0 0 1-7.4 7.4.7.7 0 0 0-.8.8A7.8 7.8 0 1 0 11.7 2.7Z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleCreateNote}
              className="hairline inline-flex items-center rounded-full bg-elevated/90 px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span className="mr-2 text-base leading-none text-muted">+</span>
              New note
            </button>
          </div>
        </div>

        <div className="mt-5">
          <SearchInput />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {totalNotes === 1 ? '1 note' : `${totalNotes} notes`}
        </p>
        <div className="h-px w-14 bg-line/80" />
      </div>

      <NoteList notes={notes} totalNotes={totalNotes} onSelect={onNoteSelect} />
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-30 md:hidden ${
          isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <button
          type="button"
          aria-label="Close notes"
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-ink/25 backdrop-blur-sm transition ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          className={`absolute inset-x-0 bottom-0 top-20 flex flex-col overflow-hidden rounded-t-[32px] border border-line/80 bg-panel/97 shadow-[0_-14px_50px_rgba(28,25,23,0.18)] transition duration-300 ${
            isMobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
            <div>
              <p className="font-serif text-xl tracking-calm text-ink">Your notes</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Mobile library</p>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="hairline inline-flex h-10 w-10 items-center justify-center rounded-full bg-elevated/90 text-muted transition hover:bg-elevated hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>

          {sidebarContent}
        </aside>
      </div>

      <aside className="hidden w-full shrink-0 flex-col border-b border-line/80 bg-panel/95 md:flex md:min-h-full md:w-[356px] md:border-b-0 md:border-r">
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
