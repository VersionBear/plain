import NoteList from './NoteList';
import SearchInput from './SearchInput';
import { useNotesStore } from '../store/useNotesStore';
import { Moon, Sun, Plus, HardDrive, Download, X, FolderSync } from 'lucide-react';
import clsx from 'clsx';

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
  appVersion,
}) {
  const createNote = useNotesStore((state) => state.createNote);
  const setActiveSection = useNotesStore((state) => state.setActiveSection);
  const connectFolderStorage = useNotesStore((state) => state.connectFolderStorage);
  const importLegacyNotes = useNotesStore((state) => state.importLegacyNotes);
  const handleCreateNote = onCreateNote ?? createNote;
  const currentSectionCount = activeSection === 'trash' ? trashedNotesCount : activeNotesCount;
  const currentYear = new Date().getFullYear();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 md:p-6 border-b border-line flex flex-col gap-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Plain</h1>
            <p className="text-xs text-muted mt-0.5 tracking-wide">v{appVersion}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 text-muted hover:text-ink hover:bg-line/50 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              type="button"
              onClick={handleCreateNote}
              className="p-2 text-ink hover:bg-line/50 rounded-lg transition-colors bg-line/30"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Storage Section */}
        <div className="rounded-xl border border-line bg-elevated p-3.5 text-sm flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <HardDrive size={16} className="text-muted" />
              <span>{storageStatus.label}</span>
            </div>
            {storageStatus.hasFolderConnection && (
              <span className="text-[10px] uppercase tracking-wider bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
                Disk
              </span>
            )}
          </div>
          <p className="text-xs text-muted leading-relaxed">{storageStatus.detail}</p>
          
          {storageStatus.supportsFolderPicker && !storageStatus.hasFolderConnection && (
            <button
              type="button"
              onClick={() => void connectFolderStorage()}
              disabled={storageStatus.isConnectingFolder || !isHydrated}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-lg bg-ink text-canvas py-2 text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
            >
              <FolderSync size={14} />
              {storageStatus.isConnectingFolder ? 'Connecting...' : 'Choose folder'}
            </button>
          )}

          {storageStatus.pendingImportCount > 0 && (
            <div className="mt-2 pt-2 border-t border-line">
              <p className="text-xs text-muted mb-2">
                {storageStatus.pendingImportCount} older notes available
              </p>
              <button
                type="button"
                onClick={() => void importLegacyNotes()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-line py-1.5 text-xs font-medium hover:bg-line/50 transition"
              >
                <Download size={14} />
                Import legacy notes
              </button>
            </div>
          )}
        </div>

        <SearchInput />
      </div>

      <div className="px-4 py-3 border-b border-line shrink-0">
        <div className="flex bg-line/30 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveSection('notes')}
            className={clsx(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-all duration-200",
              activeSection === 'notes' ? "bg-elevated text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            Notes {activeNotesCount > 0 && <span className="opacity-60 ml-1">({activeNotesCount})</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('trash')}
            className={clsx(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-all duration-200",
              activeSection === 'trash' ? "bg-elevated text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            Trash {trashedNotesCount > 0 && <span className="opacity-60 ml-1">({trashedNotesCount})</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <NoteList notes={notes} totalNotes={currentSectionCount} onSelect={onNoteSelect} section={activeSection} />
      </div>

      <div className="px-4 py-3 border-t border-line shrink-0">
        <p className="text-xs text-muted text-center">&copy; {currentYear} Plain</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-30 md:hidden transition-opacity duration-300",
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          aria-label="Close notes"
          onClick={onCloseMobile}
          className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        />

        <aside
          className={clsx(
            "absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-panel shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-line">
            <h2 className="font-semibold text-lg text-ink">Menu</h2>
            <button onClick={onCloseMobile} className="p-2 text-muted hover:bg-line/50 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarContent}
          </div>
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden md:flex flex-col border-r border-line bg-panel transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-[320px] lg:w-[360px] opacity-100"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
