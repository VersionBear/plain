import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import clsx from 'clsx';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  FolderSync,
  HardDrive,
  Info,
  Plus,
  Settings,
  X,
} from 'lucide-react';
import NoteList from './NoteList';
import SearchInput from './SearchInput';
import TagFilterBar from './TagFilterBar';
import { useNotesStore } from '../store/useNotesStore';
import { useOverlayFocus } from '../hooks/useOverlayFocus';
import { DOCS_URL, PRIVACY_URL, SUPPORT_URL } from '../utils/publicLinks';

function Sidebar({
  notes,
  activeNotesCount,
  trashedNotesCount,
  onCreateNote,
  onNoteSelect,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  activeSection,
  activeTag,
  availableTags,
  storageStatus,
  isHydrated,
  appVersion,
  hasEarlyAccess,
  activeProductName,
  onOpenFoundersRedeem,
  onOpenSettings,
}) {
  const createNote = useNotesStore((state) => state.createNote);
  const setActiveSection = useNotesStore((state) => state.setActiveSection);
  const setActiveTag = useNotesStore((state) => state.setActiveTag);
  const renameTag = useNotesStore((state) => state.renameTag);
  const deleteTag = useNotesStore((state) => state.deleteTag);
  const connectFolderStorage = useNotesStore(
    (state) => state.connectFolderStorage,
  );
  const importLegacyNotes = useNotesStore((state) => state.importLegacyNotes);
  const currentSectionCount =
    activeSection === 'trash' ? trashedNotesCount : activeNotesCount;
  const isZenMode = useSettingsStore((state) => state.isZenMode);
  const currentYear = new Date().getFullYear();
  const [isStorageExpanded, setIsStorageExpanded] = useState(false);
  const mobileSidebarRef = useRef(null);

  useOverlayFocus({
    isOpen: isMobileOpen,
    containerRef: mobileSidebarRef,
    onClose: onCloseMobile,
  });

  useEffect(() => {
    if (storageStatus.lastError || storageStatus.pendingImportCount > 0) {
      setIsStorageExpanded(true);
    }
  }, [storageStatus.lastError, storageStatus.pendingImportCount]);

  const storageLabel = useMemo(() => {
    if (storageStatus.hasFolderConnection) {
      return 'Folder storage active';
    }

    if (storageStatus.supportsFolderPicker) {
      return 'Browser storage active';
    }

    return 'On-device browser storage';
  }, [storageStatus.hasFolderConnection, storageStatus.supportsFolderPicker]);

  const storageCaption = useMemo(() => {
    if (storageStatus.isConnectingFolder) {
      return 'Connecting your folder...';
    }

    if (
      !storageStatus.hasFolderConnection &&
      storageStatus.hasStoredFolderHandle
    ) {
      return 'Reconnect your folder to keep notes as Markdown files on disk.';
    }

    if (storageStatus.pendingImportCount > 0) {
      return `${storageStatus.pendingImportCount} older notes ready to import`;
    }

    if (storageStatus.hasFolderConnection) {
      return 'Notes save to your chosen folder as Markdown files.';
    }

    if (storageStatus.isIOS) {
      return 'Notes stay in this browser on this device. Plain has no built-in sync, and iOS does not support folder storage here.';
    }

    if (storageStatus.supportsFolderPicker) {
      return 'Notes stay in this browser on this device until you connect a folder.';
    }

    return 'Notes stay in browser-managed storage on this device.';
  }, [
    storageStatus.hasFolderConnection,
    storageStatus.hasStoredFolderHandle,
    storageStatus.isConnectingFolder,
    storageStatus.pendingImportCount,
    storageStatus.supportsFolderPicker,
    storageStatus.isIOS,
  ]);

  const showTagFilters =
    activeSection === 'notes' &&
    (availableTags.length > 0 || Boolean(activeTag));

  const handleTagSelect = (tag) => {
    setActiveTag(tag);

    if (isMobileOpen) {
      onCloseMobile?.();
    }
  };

  const handleCreateNote = (event) => {
    if (onCreateNote) {
      onCreateNote(event.currentTarget);
      return;
    }

    createNote();
  };

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <div className="shrink-0 px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                  Plain
                </h1>
                <span className="text-[11px] text-muted">v{appVersion}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Open settings"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-line/50 hover:text-ink"
              >
                <Settings size={18} />
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                aria-label="Create new note"
                className="rounded-xl bg-line/30 p-2 text-ink transition-colors hover:bg-line/50"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-line/50 hover:text-ink md:hidden"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <SearchInput />

          <div className="rounded-2xl bg-line/25 p-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSection('notes')}
                title="View notes"
                aria-pressed={activeSection === 'notes'}
                className={clsx(
                  'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                  activeSection === 'notes'
                    ? 'bg-elevated text-ink shadow-sm'
                    : 'text-muted hover:text-ink',
                )}
              >
                Notes{' '}
                {activeNotesCount > 0 ? (
                  <span className="ml-1 opacity-60">({activeNotesCount})</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('trash')}
                title="View trash"
                aria-pressed={activeSection === 'trash'}
                className={clsx(
                  'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                  activeSection === 'trash'
                    ? 'bg-elevated text-ink shadow-sm'
                    : 'text-muted hover:text-ink',
                )}
              >
                Trash{' '}
                {trashedNotesCount > 0 ? (
                  <span className="ml-1 opacity-60">({trashedNotesCount})</span>
                ) : null}
              </button>
            </div>
          </div>

          {showTagFilters ? (
            <TagFilterBar
              tags={availableTags}
              activeTag={activeTag}
              onTagSelect={handleTagSelect}
              onRenameTag={renameTag}
              onDeleteTag={deleteTag}
            />
          ) : null}

          <div className="rounded-xl border border-line/60 bg-elevated/30">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setIsStorageExpanded((current) => !current)}
                className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                {storageStatus.hasFolderConnection ? (
                  <CheckCircle2
                    size={14}
                    className="shrink-0 text-emerald-500"
                  />
                ) : (
                  <HardDrive
                    size={14}
                    className="shrink-0 text-muted transition-colors group-hover:text-ink"
                  />
                )}
                <span className="truncate text-xs font-medium text-ink">
                  {storageLabel}
                </span>
                <ChevronDown
                  size={14}
                  className={clsx(
                    'shrink-0 text-muted transition-transform group-hover:text-ink',
                    isStorageExpanded ? 'rotate-180' : '',
                  )}
                />
              </button>

              {!storageStatus.hasFolderConnection &&
              storageStatus.supportsFolderPicker ? (
                <button
                  type="button"
                  onClick={() => void connectFolderStorage()}
                  disabled={storageStatus.isConnectingFolder || !isHydrated}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-line/40 px-2 py-1 text-[10px] font-medium text-ink transition-colors hover:bg-line/60 disabled:opacity-50"
                >
                  <FolderSync size={10} />
                  {storageStatus.isConnectingFolder
                    ? 'Connecting...'
                    : storageStatus.hasStoredFolderHandle
                      ? 'Reconnect'
                      : 'Choose folder'}
                </button>
              ) : null}
            </div>

            {isStorageExpanded ? (
              <div className="space-y-3 border-t border-line/60 px-3 py-3">
                <div>
                  <p className="text-xs font-medium text-ink">
                    {storageCaption}
                  </p>
                  {storageStatus.detail ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {storageStatus.detail}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-line/25 px-3 py-2 text-xs leading-relaxed text-muted">
                  No built-in sync. Browser-only storage stays in this browser
                  on this device. If you need a copy somewhere else, connect a
                  folder.
                </div>

                {!storageStatus.supportsFolderPicker && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Folder storage is not available on this device. Notes stay
                      in this browser on this device.
                    </span>
                  </div>
                )}

                {storageStatus.lastError ? (
                  <div className="bg-red-500/8 flex items-start gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{storageStatus.lastError}</span>
                  </div>
                ) : null}

                {storageStatus.pendingImportCount > 0 ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-line/25 px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium text-ink">
                        Legacy notes available
                      </p>
                      <p className="text-[11px] text-muted">
                        {storageStatus.pendingImportCount} older notes ready to
                        import
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void importLegacyNotes()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink transition-colors hover:bg-line/40"
                    >
                      <Download size={12} />
                      Import
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted transition-colors hover:text-ink"
                  >
                    Storage guide
                  </a>
                  <a
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted transition-colors hover:text-ink"
                  >
                    Support
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-line/80">
        <NoteList
          notes={notes}
          totalNotes={currentSectionCount}
          onSelect={onNoteSelect}
          section={activeSection}
        />
      </div>

      <div className="shrink-0 border-t border-line/80 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-y-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center font-medium text-muted transition-colors hover:text-ink"
            >
              Documentation
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center font-medium text-muted transition-colors hover:text-ink"
            >
              Support
            </a>
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center font-medium text-muted transition-colors hover:text-ink"
            >
              Privacy
            </a>
            <button
              type="button"
              onClick={onOpenFoundersRedeem}
              className={clsx(
                'inline-flex items-center gap-1.5 font-medium transition-colors hover:text-ink',
                hasEarlyAccess
                  ? 'text-emerald-600 dark:text-emerald-300'
                  : 'text-accent',
              )}
            >
              {hasEarlyAccess ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activeProductName === 'Plain Founders Pack'
                    ? 'Founders active'
                    : 'Pro active'}
                </>
              ) : (
                'Activate License'
              )}
            </button>
          </div>
          <div className="font-medium text-muted/60">
            &copy; {currentYear} Plain
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        aria-hidden={!isMobileOpen}
        inert={isMobileOpen ? undefined : ''}
        className={clsx(
          'fixed inset-0 z-30 transition-opacity duration-300 md:hidden',
          isMobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      >
        <button
          type="button"
          aria-label="Close notes"
          onClick={onCloseMobile}
          className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        />

        <aside
          ref={mobileSidebarRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notes sidebar"
          aria-hidden={!isMobileOpen}
          tabIndex={-1}
          className={clsx(
            'absolute inset-y-0 left-0 flex min-h-0 w-[85%] max-w-[320px] flex-col overflow-hidden bg-panel shadow-2xl transition-transform duration-300 ease-out',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="min-h-0 flex-1">{sidebarContent}</div>
        </aside>
      </div>

      <aside
        className={clsx(
          'hidden min-h-0 shrink-0 flex-col overflow-hidden border-r border-line bg-panel transition-all duration-300 ease-in-out md:flex',
          isCollapsed
            ? 'w-0 overflow-hidden opacity-0'
            : isZenMode
              ? 'absolute z-40 h-full w-[320px] -translate-x-[310px] opacity-0 hover:translate-x-0 hover:opacity-100 lg:w-[360px] lg:-translate-x-[350px]'
              : 'w-[320px] opacity-100 lg:w-[360px]',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
