import {
  Suspense,
  lazy,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import packageJson from '../package.json';
import EditorPane from './components/EditorPane';
import Sidebar from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import {
  selectHasEarlyAccess,
  useFoundersStore,
} from './store/useFoundersStore';
import { useExportStore } from './store/useExportStore';
import { useNotesStore } from './store/useNotesStore';
import {
  filterNotes,
  filterNotesByTag,
  getTagSummary,
  sortNotes,
  sortTrashedNotes,
} from './utils/notes';
import { Menu, Plus } from 'lucide-react';

const ExportModal = lazy(() => import('./components/ExportModal'));
const FoundersRedeemModal = lazy(
  () => import('./components/FoundersRedeemModal'),
);
const SettingsModal = lazy(() => import('./components/SettingsModal'));

function HydrationScreen() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-canvas px-6 text-ink">
      <div className="w-full max-w-sm rounded-[28px] border border-line bg-panel/80 px-6 py-8 text-center shadow-panel backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Plain
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Loading your notes
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Opening your library and local storage.
        </p>
      </div>
    </div>
  );
}

function App() {
  const themeState = useTheme();
  const appVersion = packageJson.version;
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const createNote = useNotesStore((state) => state.createNote);
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const activeTag = useNotesStore((state) => state.activeTag);
  const activeSection = useNotesStore((state) => state.activeSection);
  const hydrateLibrary = useNotesStore((state) => state.hydrateLibrary);
  const isHydrated = useNotesStore((state) => state.isHydrated);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const isExportModalOpen = useExportStore((state) => state.isExportModalOpen);
  const hasEarlyAccess = useFoundersStore(selectHasEarlyAccess);
  const activeProductName = useFoundersStore((state) => state.productName);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [isFoundersModalOpen, setIsFoundersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  const visibleNotes = useMemo(() => {
    const currentNotes =
      activeSection === 'trash'
        ? sortTrashedNotes(trashedNotes)
        : sortNotes(notes);
    const tagFilteredNotes =
      activeSection === 'notes'
        ? filterNotesByTag(currentNotes, activeTag)
        : currentNotes;

    return filterNotes(tagFilteredNotes, deferredSearchQuery);
  }, [activeSection, activeTag, deferredSearchQuery, notes, trashedNotes]);

  const availableTags = useMemo(() => getTagSummary(notes), [notes]);

  const handleCreateNote = () => {
    createNote();
    setIsMobileSidebarOpen(false);
  };

  if (!isHydrated) {
    return <HydrationScreen />;
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-canvas font-sans text-ink selection:bg-accent/20 md:flex-row">
      {/* Mobile Top Bar */}
      <div className="z-20 flex shrink-0 items-center justify-between border-b border-line bg-canvas px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
            className="-ml-1 p-1 text-muted transition-colors hover:text-ink"
          >
            <Menu size={20} />
          </button>
          <span className="font-medium tracking-tight">Plain</span>
        </div>
        <button
          onClick={handleCreateNote}
          aria-label="Create new note"
          className="-mr-1 p-1 text-muted transition-colors hover:text-ink"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar
          notes={visibleNotes}
          activeNotesCount={notes.length}
          trashedNotesCount={trashedNotes.length}
          onCreateNote={handleCreateNote}
          onNoteSelect={() => setIsMobileSidebarOpen(false)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isDesktopSidebarCollapsed}
          activeSection={activeSection}
          activeTag={activeTag}
          availableTags={availableTags}
          storageStatus={storageStatus}
          isHydrated={isHydrated}
          appVersion={appVersion}
          hasEarlyAccess={hasEarlyAccess}
          activeProductName={activeProductName}
          onOpenFoundersRedeem={() => setIsFoundersModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        <EditorPane
          totalNotes={
            activeSection === 'trash' ? trashedNotes.length : notes.length
          }
          searchQuery={searchQuery}
          isSidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleSidebar={() =>
            setIsDesktopSidebarCollapsed((current) => !current)
          }
          activeSection={activeSection}
        />
      </div>

      {/* Export Modal */}
      {isExportModalOpen ? (
        <Suspense fallback={null}>
          <ExportModal />
        </Suspense>
      ) : null}

      {isFoundersModalOpen ? (
        <Suspense fallback={null}>
          <FoundersRedeemModal
            isOpen={isFoundersModalOpen}
            onClose={() => setIsFoundersModalOpen(false)}
          />
        </Suspense>
      ) : null}

      {isSettingsModalOpen ? (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            theme={themeState.theme}
            setTheme={themeState.setTheme}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export default App;
