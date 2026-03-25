import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import packageJson from '../package.json';
import EditorPane from './components/EditorPane';
import Sidebar from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import { useNotesStore } from './store/useNotesStore';
import { filterNotes, sortNotes, sortTrashedNotes } from './utils/notes';
import { Menu, Plus } from 'lucide-react';

function App() {
  const appVersion = packageJson.version;
  const { theme, toggleTheme } = useTheme();
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const createNote = useNotesStore((state) => state.createNote);
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const activeSection = useNotesStore((state) => state.activeSection);
  const hydrateLibrary = useNotesStore((state) => state.hydrateLibrary);
  const isHydrated = useNotesStore((state) => state.isHydrated);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  const visibleNotes = useMemo(() => {
    const currentNotes = activeSection === 'trash' ? sortTrashedNotes(trashedNotes) : sortNotes(notes);
    return filterNotes(currentNotes, deferredSearchQuery);
  }, [activeSection, deferredSearchQuery, notes, trashedNotes]);

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
    <div className="h-dvh w-full flex overflow-hidden bg-canvas text-ink font-sans selection:bg-accent/20">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-1 -ml-1 text-muted hover:text-ink transition-colors">
            <Menu size={20} />
          </button>
          <span className="font-medium tracking-tight">Plain</span>
        </div>
        <button onClick={handleCreateNote} className="p-1 -mr-1 text-muted hover:text-ink transition-colors">
          <Plus size={20} />
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex w-full h-full pt-[53px] md:pt-0">
        <Sidebar
          notes={visibleNotes}
          activeNotesCount={notes.length}
          trashedNotesCount={trashedNotes.length}
          theme={theme}
          toggleTheme={toggleTheme}
          onCreateNote={handleCreateNote}
          onNoteSelect={() => setIsMobileSidebarOpen(false)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isDesktopSidebarCollapsed}
          activeSection={activeSection}
          storageStatus={storageStatus}
          isHydrated={isHydrated}
          appVersion={appVersion}
        />
        <EditorPane
          totalNotes={activeSection === 'trash' ? trashedNotes.length : notes.length}
          searchQuery={searchQuery}
          isSidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleSidebar={() => setIsDesktopSidebarCollapsed((current) => !current)}
          activeSection={activeSection}
        />
      </div>
    </div>
  );
}

export default App;