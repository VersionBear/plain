import NoteList from './NoteList';
import SearchInput from './SearchInput';
import { useNotesStore } from '../store/useNotesStore';

function Sidebar({
  notes,
  activeNotesCount,
  trashedNotesCount,
  theme,
  toggleTheme,
  onCreateNote,
  onNoteSelect,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  activeSection,
  storageStatus,
  isHydrated,
}) {
  const createNote = useNotesStore((state) => state.createNote);
  const setActiveSection = useNotesStore((state) => state.setActiveSection);
  const connectFolderStorage = useNotesStore((state) => state.connectFolderStorage);
  const importLegacyNotes = useNotesStore((state) => state.importLegacyNotes);
  const handleCreateNote = onCreateNote ?? createNote;
  const currentSectionCount = activeSection === 'trash' ? trashedNotesCount : activeNotesCount;

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

        <div className="mt-5 rounded-[24px] border border-line/70 bg-elevated/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Storage</p>
              <p className="mt-1 text-sm font-medium text-ink">{storageStatus.label}</p>
            </div>
            {storageStatus.hasFolderConnection ? (
              <span className="rounded-full border border-accent/70 bg-accent/25 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-ink">
                Disk-backed
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{storageStatus.detail}</p>
          {storageStatus.supportsFolderPicker && !storageStatus.hasFolderConnection ? (
            <button
              type="button"
              onClick={() => void connectFolderStorage()}
              disabled={storageStatus.isConnectingFolder || !isHydrated}
              className="mt-3 inline-flex items-center rounded-full border border-line/80 bg-panel/88 px-4 py-2 text-sm font-medium text-ink transition hover:border-line hover:bg-panel focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {storageStatus.isConnectingFolder ? 'Connecting folder...' : 'Choose notes folder'}
            </button>
          ) : null}
          {storageStatus.pendingImportCount > 0 ? (
            <div className="mt-3 rounded-[20px] border border-line/70 bg-panel/78 p-3">
              <p className="text-sm text-ink">
                Import {storageStatus.pendingImportCount} older {storageStatus.pendingImportCount === 1 ? 'note' : 'notes'} from legacy browser storage.
              </p>
              <button
                type="button"
                onClick={() => void importLegacyNotes()}
                className="mt-3 inline-flex items-center rounded-full border border-line/80 bg-elevated/88 px-4 py-2 text-sm font-medium text-ink transition hover:border-line hover:bg-panel focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Import legacy notes
              </button>
            </div>
          ) : null}
          {storageStatus.lastError ? (
            <p className="mt-3 text-sm leading-6 text-ink">{storageStatus.lastError}</p>
          ) : null}
        </div>

        <div className="mt-5">
          <SearchInput />
        </div>
      </div>

      <div className="border-b border-line/80 px-5 py-3 md:px-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('notes')}
            className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
              activeSection === 'notes'
                ? 'border-accent bg-accent text-ink'
                : 'border-line/80 bg-elevated/70 text-muted hover:border-line hover:bg-panel hover:text-ink'
            }`}
          >
            Notes {activeNotesCount > 0 ? `(${activeNotesCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('trash')}
            className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
              activeSection === 'trash'
                ? 'border-accent bg-accent text-ink'
                : 'border-line/80 bg-elevated/70 text-muted hover:border-line hover:bg-panel hover:text-ink'
            }`}
          >
            Trash {trashedNotesCount > 0 ? `(${trashedNotesCount})` : ''}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {activeSection === 'trash'
            ? currentSectionCount === 1
              ? '1 trashed note'
              : `${currentSectionCount} trashed notes`
            : currentSectionCount === 1
              ? '1 note'
              : `${currentSectionCount} notes`}
        </p>
        <div className="h-px w-14 bg-line/80" />
      </div>

      <NoteList notes={notes} totalNotes={currentSectionCount} onSelect={onNoteSelect} section={activeSection} />
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
              <p className="font-serif text-xl tracking-calm text-ink">
                {activeSection === 'trash' ? 'Trash' : 'Your notes'}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Mobile library</p>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="hairline inline-flex h-10 w-10 items-center justify-center rounded-full bg-elevated/90 text-muted transition hover:bg-elevated hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                x
              </span>
            </button>
          </div>

          {sidebarContent}
        </aside>
      </div>

      <aside
        className={`hidden w-full shrink-0 flex-col border-b border-line/80 bg-panel/95 transition-[width,opacity,border-color] duration-300 md:flex md:min-h-full md:border-b-0 md:overflow-hidden ${
          isCollapsed
            ? 'md:w-0 md:border-r-0 md:pointer-events-none md:opacity-0'
            : 'md:w-[356px] md:border-r md:opacity-100'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
