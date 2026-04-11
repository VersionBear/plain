import {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import packageJson from '../package.json';
import EditorPane from './components/EditorPane';
import Sidebar from './components/Sidebar';
import { NotificationContainer } from './components/common/NotificationToast';
import { ConflictResolutionModal } from './components/common/ConflictModal';
import { useTheme } from './hooks/useTheme';
import { useNotesStore } from './store/useNotesStore';
import {
  filterNotes,
  filterNotesByTag,
  getTagSummary,
  sortNotes,
  sortTrashedNotes,
} from './utils/notes';
import { Menu, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConflictStore } from './store/useConflictStore';
import { resolveConflict } from './store/notesStore/conflictResolver';
import { useNotificationStore } from './store/useNotificationStore';
import { shouldShowOnboarding } from './utils/onboarding';

const SettingsModal = lazy(() => import('./components/SettingsModal'));
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow'));

function HydrationScreen() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-canvas px-6 text-ink">
      <div className="w-full max-w-sm rounded-[32px] border border-line/50 bg-panel/90 px-8 py-10 text-center shadow-panel backdrop-blur-xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted/60">
          Plain
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tightest">
          Loading your notes
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted/60">
          Opening notes from this browser or your connected folder.
        </p>
      </div>
    </div>
  );
}

function getDisplayVersion(version) {
  return version === '1.0.0' ? '1' : version;
}

function App() {
  const themeState = useTheme();
  const appVersion = getDisplayVersion(packageJson.version);
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const createNote = useNotesStore((state) => state.createNote);
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const activeTag = useNotesStore((state) => state.activeTag);
  const activeSection = useNotesStore((state) => state.activeSection);
  const hydrateLibrary = useNotesStore((state) => state.hydrateLibrary);
  const isHydrated = useNotesStore((state) => state.isHydrated);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const startFileWatcher = useNotesStore((state) => state.startFileWatcher);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() =>
    shouldShowOnboarding(null, isHydrated),
  );
  const activeConflict = useConflictStore((state) => state.activeConflict);
  const clearConflict = useConflictStore((state) => state.clearConflict);
  const updateNote = useNotesStore((state) => state.updateNote);

  const handleCreateNote = useCallback((options = {}) => {
    createNote(options);
    setIsMobileSidebarOpen(false);
  }, [createNote]);

  useEffect(() => {
    if (!isHydrated) return;

    // Show onboarding if needed after hydration
    setShowOnboarding(shouldShowOnboarding(null, true));

    // Load Formshare widget script dynamically after hydration
    // to prevent it from crashing when DOM elements are not yet ready.
    const script = document.createElement('script');
    script.src = 'https://formshare.ai/embed/v1.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isHydrated]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;
      const key = event.key.toLowerCase();

      // New Note: Cmd/Ctrl + N OR Alt + N (Alt is better for Windows browser conflict)
      if ((isMod && key === 'n') || (isAlt && key === 'n')) {
        event.preventDefault();
        handleCreateNote();
      } 
      // Search: Cmd/Ctrl + K OR Alt + K
      else if ((isMod && key === 'k') || (isAlt && key === 'k')) {
        event.preventDefault();
        document.querySelector('input[type="search"]')?.focus();
      } 
      // Toggle Sidebar: Cmd/Ctrl + \ OR Alt + \
      else if ((isMod && key === '\\') || (isAlt && key === '\\')) {
        event.preventDefault();
        setIsDesktopSidebarCollapsed((prev) => !prev);
      } 
      // Settings: Cmd/Ctrl + , OR Alt + ,
      else if ((isMod && key === ',') || (isAlt && key === ',')) {
        event.preventDefault();
        setIsSettingsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  const handleConflictResolve = (choice, appNote, diskNote) => {
    const result = resolveConflict(choice, appNote, diskNote);

    if (result.resolution === 'kept_both' && result.duplicateNote) {
      createNote({ overrides: result.duplicateNote });
    } else if (result.resolvedNote) {
      updateNote(result.resolvedNote.id, result.resolvedNote);
    }

    clearConflict();

    const messages = {
      kept_app_version: 'Kept app version.',
      kept_disk_version: 'Updated from disk.',
      kept_both: 'Kept both versions.',
    };

    useNotificationStore.getState().showInfo(messages[result.resolution] || 'Conflict resolved.');
  };

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  // Start auto-sync by default when there's a folder connection
  useEffect(() => {
    if (!isHydrated) return;
    const saved = window.localStorage.getItem('plain-auto-sync-enabled');
    const isEnabled = saved !== 'false'; // defaults to true
    if (isEnabled && storageStatus.hasFolderConnection) {
      startFileWatcher();
    }
  }, [isHydrated, storageStatus.hasFolderConnection, startFileWatcher]);

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



  return (
    <AnimatePresence mode="wait">
      {!isHydrated ? (
        <HydrationScreen key="hydration" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-dvh w-full flex-col overflow-hidden bg-chrome font-sans text-ink selection:bg-accent/20 md:flex-row"
        >
          {/* Mobile Top Bar */}
          <div className="z-20 flex shrink-0 items-center justify-between border-b border-line/40 bg-canvas/90 px-3 py-2 backdrop-blur-xl md:hidden">
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
                whileTap={{ scale: 0.92 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted/70 transition-colors hover:bg-line/30 hover:text-ink"
              >
                <Menu size={22} />
              </motion.button>
              <span className="text-[15px] font-semibold tracking-tightest">Plain</span>
            </div>
            <motion.button
              onClick={() => handleCreateNote()}
              aria-label="Create new note"
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors hover:bg-accent/15"
            >
              <Plus size={22} />
            </motion.button>
          </div>

          {/* Main Layout */}
          <div className="flex min-h-0 w-full flex-1">
            <Sidebar
              notes={visibleNotes}
              activeNotesCount={notes.length}
              trashedNotesCount={trashedNotes.length}
              onCreateNote={() => handleCreateNote()}
              onNoteSelect={() => setIsMobileSidebarOpen(false)}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              isCollapsed={isDesktopSidebarCollapsed}
              activeSection={activeSection}
              activeTag={activeTag}
              availableTags={availableTags}
              appVersion={appVersion}
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
              onCreateNote={() => handleCreateNote()}
            />
          </div>

          <Suspense fallback={null}>
            <AnimatePresence>
              {showOnboarding && (
                <OnboardingFlow
                  key="onboarding"
                  isOpen={showOnboarding}
                  onComplete={handleOnboardingComplete}
                  theme={themeState.theme}
                  setTheme={themeState.setTheme}
                />
              )}
            </AnimatePresence>
          </Suspense>

          <Suspense fallback={null}>
            <SettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              theme={themeState.theme}
              setTheme={themeState.setTheme}
              storageStatus={storageStatus}
              isHydrated={isHydrated}
              onReplayOnboarding={() => {
                void useNotesStore.getState().seedWelcomeNotes();
                setShowOnboarding(true);
              }}
            />
          </Suspense>

          {activeConflict && (
            <ConflictResolutionModal
              conflict={activeConflict}
              onResolve={handleConflictResolve}
              onClose={clearConflict}
            />
          )}

          <NotificationContainer />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
