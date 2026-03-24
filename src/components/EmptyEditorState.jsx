import { useNotesStore } from '../store/useNotesStore';

function EmptyEditorState({ totalNotes, searchQuery, isSidebarCollapsed, onToggleSidebar, activeSection }) {
  const createNote = useNotesStore((state) => state.createNote);

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className="max-w-xl text-center">
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Show notes sidebar' : 'Hide notes sidebar'}
            aria-label={isSidebarCollapsed ? 'Show notes sidebar' : 'Hide notes sidebar'}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-line/80 bg-elevated/85 text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent md:inline-flex"
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
        </div>

        <p className="font-serif text-4xl tracking-calm text-ink md:text-5xl">
          {activeSection === 'trash'
            ? 'Nothing lost. Nothing rushed.'
            : totalNotes === 0
              ? 'Open. Write. Done.'
              : 'A smaller place for your thoughts.'}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted">
          {activeSection === 'trash'
            ? searchQuery
              ? 'Your search is hiding the current trashed note. Clear the search or pick another note from Trash.'
              : totalNotes === 0
                ? 'Deleted notes land here first, so there is always a recovery step before anything disappears for good.'
                : 'Select a trashed note to restore it or remove it permanently.'
            : totalNotes === 0
              ? 'Plain is intentionally limited. No accounts. No sync. No feature clutter. Just a calm, local-first space to write and return.'
              : searchQuery
                ? 'Your search is hiding the currently selected note. Clear the search or create something new.'
                : 'Select a note from the left or create a fresh one. Plain stays out of the way on purpose.'}
        </p>

        {activeSection === 'notes' ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={createNote}
              className="hairline rounded-full bg-elevated/90 px-5 py-3 text-sm font-medium text-ink transition hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Create a note
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default EmptyEditorState;
