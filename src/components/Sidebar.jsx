import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Settings,
  X,
  RefreshCw,
} from 'lucide-react';
import NoteList from './NoteList';
import SearchInput from './SearchInput';
import TagFilterBar from './TagFilterBar';
import { useNotesStore } from '../store/useNotesStore';
import { useOverlayFocus } from '../hooks/useOverlayFocus';

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
  appVersion,
  onOpenSettings,
}) {
  const createNote = useNotesStore((state) => state.createNote);
  const setActiveSection = useNotesStore((state) => state.setActiveSection);
  const setActiveTag = useNotesStore((state) => state.setActiveTag);
  const renameTag = useNotesStore((state) => state.renameTag);
  const deleteTag = useNotesStore((state) => state.deleteTag);
  const refreshLibrary = useNotesStore((state) => state.refreshLibrary);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const currentSectionCount =
    activeSection === 'trash' ? trashedNotesCount : activeNotesCount;
  const currentYear = new Date().getFullYear();
  const mobileSidebarRef = useRef(null);

  useOverlayFocus({
    isOpen: isMobileOpen,
    containerRef: mobileSidebarRef,
    onClose: onCloseMobile,
  });

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

  const handleRefresh = async () => {
    await refreshLibrary();
  };

  const showRefreshButton = storageStatus.kind === 'folder';

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 pb-2.5 pt-4 md:px-5 md:pb-4 md:pt-6">
        <div className="flex flex-col gap-3 md:gap-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-[20px] font-black tracking-tighter text-ink md:text-[23px]">
                  Plain
                </h1>
                <span className="hidden rounded-full border border-line/50 bg-line/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted md:inline-flex">
                  v{appVersion}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-line/10 rounded-2xl border border-line/5 transition-all">
              {showRefreshButton && (
                <motion.button
                  type="button"
                  onClick={handleRefresh}
                  disabled={storageStatus.isRefreshing}
                  aria-label="Refresh notes from folder"
                  whileHover={{ backgroundColor: 'rgb(var(--color-line) / 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted/70 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={17} className={storageStatus.isRefreshing ? 'animate-spin' : ''} />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={onOpenSettings}
                aria-label="Open settings"
                whileHover={{ backgroundColor: 'rgb(var(--color-line) / 0.2)' }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted/70 transition-colors hover:text-ink"
              >
                <Settings size={17} />
              </motion.button>
              <motion.button
                type="button"
                onClick={handleCreateNote}
                aria-label="Create new note"
                whileHover={{ scale: 1.05, backgroundColor: 'rgb(var(--color-accent) / 0.15)' }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all shadow-sm"
              >
                <Plus size={19} strokeWidth={2.5} />
              </motion.button>
              {isMobileOpen && (
                <motion.button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close menu"
                  whileTap={{ scale: 0.92 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted/70 transition-colors hover:bg-line/40 hover:text-ink md:hidden"
                >
                  <X size={19} />
                </motion.button>
              )}
            </div>
          </div>

          <SearchInput />

          {/* Segmented Tabs */}
          <div className="relative rounded-2xl bg-line/15 p-1 border border-line/30 shadow-inner md:rounded-[22px] md:p-1">
            <div className="relative flex items-center gap-0.5">
              {/* Sliding background indicator */}
              <motion.div
                className="absolute inset-y-0 w-[calc(50%-2px)] rounded-xl bg-elevated shadow-panel md:rounded-[18px]"
                animate={{ x: activeSection === 'notes' ? 0 : 'calc(100% + 2px)' }}
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
              <button
                type="button"
                onClick={() => setActiveSection('notes')}
                title="View notes"
                aria-pressed={activeSection === 'notes'}
                className={clsx(
                  'relative flex-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:rounded-[18px] md:px-3 md:py-2 md:text-[12.5px]',
                  activeSection === 'notes'
                    ? 'text-ink'
                    : 'text-muted hover:text-ink',
                )}
              >
                Notes{' '}
                {activeNotesCount > 0 ? (
                  <span className="ml-0.5 opacity-50">({activeNotesCount})</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('trash')}
                title="View trash"
                aria-pressed={activeSection === 'trash'}
                className={clsx(
                  'relative flex-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:rounded-[18px] md:px-3 md:py-2 md:text-[12.5px]',
                  activeSection === 'trash'
                    ? 'text-ink'
                    : 'text-muted hover:text-ink',
                )}
              >
                Trash{' '}
                {trashedNotesCount > 0 ? (
                  <span className="ml-0.5 opacity-50">({trashedNotesCount})</span>
                ) : null}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showTagFilters && (
              <motion.div
                key="tag-filters"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-visible"
              >
                <TagFilterBar
                  tags={availableTags}
                  activeTag={activeTag}
                  onTagSelect={handleTagSelect}
                  onRenameTag={renameTag}
                  onDeleteTag={deleteTag}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Note list */}
      <div className="flex min-h-0 flex-1 flex-col pt-1.5">
        <NoteList
          notes={notes}
          totalNotes={currentSectionCount}
          onSelect={onNoteSelect}
          section={activeSection}
        />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 p-1 bg-line/10 rounded-xl border border-line/5">
            <a
              href="https://discord.gg/Zq28kBAPZ3"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg px-2.5 py-1.5 font-bold tracking-tight text-muted/70 transition-all hover:bg-elevated hover:text-ink hover:shadow-sm"
            >
              Discord
            </a>
            <a
              href="https://formshare.ai/s/o9wz926YRe"
              target="_blank"
              rel="noreferrer"
              title="Leave a review!"
              className="inline-flex items-center rounded-lg px-2.5 py-1.5 font-bold tracking-tight text-muted/70 transition-all hover:bg-elevated hover:text-ink hover:shadow-sm"
            >
              Review
            </a>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted/30">
            &copy; {currentYear} Plain
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            aria-hidden={!isMobileOpen}
            inert={isMobileOpen ? undefined : ''}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              'fixed inset-0 z-30 md:hidden',
            )}
          >
            <motion.button
              type="button"
              aria-label="Close notes"
              onClick={onCloseMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.aside
              ref={mobileSidebarRef}
              role="dialog"
              aria-modal="true"
              aria-label="Notes sidebar"
              aria-hidden={!isMobileOpen}
              tabIndex={-1}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={clsx(
                'absolute inset-y-0 left-0 flex min-h-0 w-[88%] max-w-[340px] flex-col overflow-hidden rounded-r-2xl bg-panel shadow-elevated-lg',
              )}
            >
              <div className="min-h-0 flex-1">{sidebarContent}</div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'hidden min-h-0 shrink-0 flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex',
          isCollapsed
            ? 'w-0 opacity-0 ml-0 overflow-hidden'
            : 'w-[340px] opacity-100 lg:w-[360px] bg-transparent overflow-visible',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
