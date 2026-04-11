import { useNotesStore } from '../store/useNotesStore';
import { Plus, FolderSync, AlertCircle, Sparkles } from 'lucide-react';
import { getDailyEmptyStateMessage } from '../utils/emptyStateContent';
import { motion } from 'framer-motion';

function EmptyEditorState({
  totalNotes,
  searchQuery,
  activeSection,
  onCreateNote,
}) {
  const activeTag = useNotesStore((state) => state.activeTag);
  const storageStatus = useNotesStore((state) => state.storageStatus);
  const connectFolderStorage = useNotesStore(
    (state) => state.connectFolderStorage,
  );
  const dailyMessage = getDailyEmptyStateMessage();
  const showDailyMessage =
    activeSection === 'notes' && totalNotes > 0 && !searchQuery && !activeTag;

  const showFolderCTA =
    activeSection === 'notes' &&
    storageStatus?.supportsFolderPicker &&
    !storageStatus?.hasFolderConnection;

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-40 dark:opacity-20">
        <div className="h-[40rem] w-[40rem] animate-pulse rounded-full bg-accent/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex w-full max-w-lg animate-fade-in flex-col items-center text-center">
        {/* Premium Icon Presentation */}
        <div className="relative mb-5 flex h-16 w-16 shrink-0 items-center justify-center sm:mb-6 sm:h-20 sm:w-20">
          <div className="absolute inset-0 animate-ping rounded-[2rem] bg-accent/10 object-cover opacity-20 duration-3000"></div>
          <div className="absolute inset-2 rotate-3 rounded-[2rem] bg-accent/15 transition-transform duration-500 hover:rotate-12 hover:scale-105"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] border border-line/30 bg-elevated/80 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-elevated">
            <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
          </div>
        </div>

        {showDailyMessage ? (
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/10 bg-accent/10 py-1.5 pl-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-accent shadow-sm backdrop-blur-md">
            <Sparkles size={12} className="text-accent" />
            {dailyMessage.eyebrow}
          </span>
        ) : null}

        <h2 className="mb-2 text-xl font-extrabold tracking-tight text-ink sm:mb-3 sm:text-3xl">
          {activeSection === 'trash'
            ? 'Nothing selected'
            : totalNotes === 0
              ? 'Your notes start here'
              : searchQuery || activeTag
                ? 'Select a note to view'
                : dailyMessage.title}
        </h2>

        <p className="mb-4 max-w-md text-[13.5px] leading-relaxed text-muted/80 sm:mb-5 sm:text-[15px]">
          {activeSection === 'trash'
            ? searchQuery
              ? 'Clear search to view trashed notes.'
              : totalNotes === 0
                ? 'Your trash is empty.'
                : 'Select a trashed note to restore or permanently delete.'
            : totalNotes === 0
              ? 'Plain saves on this device first. Start writing right away.'
              : searchQuery || activeTag
                ? activeTag
                  ? `No notes match #${activeTag}${searchQuery ? ' and your current search.' : '.'}`
                  : 'No notes match your current search.'
                : dailyMessage.body}
        </p>

        {activeSection === 'notes' && (
          <p className="mb-4 max-w-sm rounded-full bg-elevated/50 px-4 py-1.5 text-[11px] font-medium leading-relaxed text-muted/70 ring-1 ring-line/40 backdrop-blur-sm sm:mb-5">
            {storageStatus?.hasFolderConnection
              ? 'This library is saving to your connected folder as Markdown files.'
              : storageStatus?.supportsFolderPicker
                ? 'Browser-only notes stay in this browser. No built-in sync.'
                : 'Notes stay in browser-managed storage on this device.'}
          </p>
        )}

        {showFolderCTA && (
          <div className="group mb-5 w-full shrink-0 overflow-hidden rounded-3xl border border-line/40 bg-elevated/30 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-500 hover:bg-elevated/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] sm:mb-6 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-4 rounded-[1.25rem] bg-canvas/80 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 p-2.5 text-accent shadow-inner ring-1 ring-accent/20 sm:p-3">
                  <FolderSync className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                </div>
                <div className="pt-1 text-left">
                  <h3 className="text-[15px] font-semibold text-ink">
                    Connect a folder for files on disk
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted/80">
                    Optional, but clearer for backup peace of mind. Your notes
                    save as Markdown files you can see and manage yourself.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void connectFolderStorage()}
                disabled={storageStatus?.isConnectingFolder}
                title="Connect a folder for persistent storage"
                className="mt-0.5 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-canvas transition-all duration-300 hover:scale-105 hover:bg-ink/90 hover:shadow-lg hover:shadow-ink/20 disabled:opacity-50 disabled:hover:scale-100 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <FolderSync size={16} />
                {storageStatus?.isConnectingFolder
                  ? 'Connecting...'
                  : storageStatus?.hasStoredFolderHandle
                    ? 'Reconnect'
                    : 'Choose folder'}
              </button>
            </div>

            {storageStatus?.lastError ? (
              <div className="mx-2 mt-2 mb-2 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-[12px] text-red-600 dark:text-red-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{storageStatus.lastError}</span>
              </div>
            ) : null}
          </div>
        )}

        {!showFolderCTA && storageStatus?.lastError ? (
          <div className="mb-5 flex w-full shrink-0 items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-[13px] text-red-600 sm:mb-6 dark:text-red-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{storageStatus.lastError}</span>
          </div>
        ) : null}

        {activeSection === 'notes' && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.button
              type="button"
              onClick={(event) => onCreateNote?.(event.currentTarget)}
              title="Create new note"
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-[14px] font-bold text-canvas shadow-[0_20px_40px_rgba(var(--color-ink)/0.15)] transition-all duration-300 hover:bg-ink/90 hover:shadow-[0_25px_50px_rgba(var(--color-ink)/0.25)] sm:px-8 sm:py-3.5"
            >
              <div className="rounded-full bg-canvas/20 p-1 transition-transform duration-500 group-hover:rotate-180">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              Create first note
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyEditorState;
