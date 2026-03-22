import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import EditorPane from './components/EditorPane';
import Sidebar from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import { useNotesStore } from './store/useNotesStore';
import { filterNotes, getNextSelectedNoteId, sortNotes } from './utils/notes';

function App() {
  const { theme, toggleTheme } = useTheme();
  const notes = useNotesStore((state) => state.notes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const selectNote = useNotesStore((state) => state.selectNote);
  const createNote = useNotesStore((state) => state.createNote);
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const visibleNotes = useMemo(() => {
    return filterNotes(sortNotes(notes), deferredSearchQuery);
  }, [notes, deferredSearchQuery]);

  useEffect(() => {
    if (!notes.length || selectedNoteId) {
      return;
    }

    selectNote(getNextSelectedNoteId(notes));
  }, [notes, selectedNoteId, selectNote]);

  useEffect(() => {
    if (selectedNoteId) {
      setIsMobileSidebarOpen(false);
    }
  }, [selectedNoteId]);

  const handleCreateNote = () => {
    createNote();
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1560px] flex-col md:px-4 md:py-4">
        <div className="sticky top-0 z-20 border-b border-line/80 bg-canvas/92 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-serif text-[1.65rem] tracking-calm text-ink">Plain</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Mobile workspace</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="hairline rounded-full bg-elevated/90 px-3.5 py-2 text-sm text-ink transition hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Notes
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                className="hairline rounded-full bg-ink px-3.5 py-2 text-sm text-canvas transition hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                New
              </button>
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
            </div>
          </div>
        </div>

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden md:min-h-0 md:flex-row md:rounded-[28px] md:border md:border-line/80 md:bg-panel/60 md:shadow-[0_10px_30px_rgba(28,25,23,0.04)]">
          <Sidebar
            notes={visibleNotes}
            totalNotes={notes.length}
            theme={theme}
            toggleTheme={toggleTheme}
            onCreateNote={handleCreateNote}
            onNoteSelect={() => setIsMobileSidebarOpen(false)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
          <EditorPane totalNotes={notes.length} searchQuery={searchQuery} />
        </div>

        <footer className="px-4 pb-6 pt-4 text-center md:px-0 md:pb-2">
          <a
            href="https://versionbear.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted transition hover:text-ink"
          >
            Made by VersionBear, versionbear.com
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
