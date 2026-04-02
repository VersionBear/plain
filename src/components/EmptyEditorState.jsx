import { useNotesStore } from '../store/useNotesStore';
import { FileText, Plus, FolderSync, AlertCircle } from 'lucide-react';
import { getDailyEmptyStateMessage } from '../utils/emptyStateContent';
import { DOCS_URL, SUPPORT_URL } from '../utils/publicLinks';

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
    <div className="flex w-full flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md animate-fade-in flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-line/30">
          <FileText size={32} className="text-muted" />
        </div>

        {showDailyMessage ? (
          <span className="mb-3 rounded-full bg-line/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {dailyMessage.eyebrow}
          </span>
        ) : null}

        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-ink">
          {activeSection === 'trash'
            ? 'Nothing selected'
            : totalNotes === 0
              ? 'Your notes start here'
              : searchQuery || activeTag
                ? 'Select a note to view'
                : dailyMessage.title}
        </h2>

        <p className="mb-7 text-sm leading-relaxed text-muted">
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
          <p className="mb-7 max-w-md text-xs leading-relaxed text-muted">
            {storageStatus?.hasFolderConnection
              ? 'This library is saving to your connected folder as Markdown files.'
              : storageStatus?.supportsFolderPicker
                ? 'Browser-only notes stay in this browser on this device. There is no built-in sync or account recovery.'
                : 'Notes stay in browser-managed storage on this device. Export backups if you need a copy somewhere else.'}
          </p>
        )}

        {showFolderCTA && (
          <div className="mb-7 w-full rounded-2xl border border-line bg-elevated/70 p-4 text-left shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-accent/10 p-2 text-accent">
                  <FolderSync size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">
                    Connect a folder for files on disk
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
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
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-medium text-canvas transition hover:opacity-90 disabled:opacity-50"
              >
                <FolderSync size={14} />
                {storageStatus?.isConnectingFolder
                  ? 'Connecting...'
                  : storageStatus?.hasStoredFolderHandle
                    ? 'Reconnect folder'
                    : 'Choose folder'}
              </button>
            </div>

            {storageStatus?.lastError ? (
              <div className="bg-red-500/8 mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{storageStatus.lastError}</span>
              </div>
            ) : null}
          </div>
        )}

        {!showFolderCTA && storageStatus?.lastError ? (
          <div className="bg-red-500/8 mb-7 flex w-full items-start gap-2 rounded-2xl border border-red-500/20 px-4 py-3 text-left text-sm text-red-600 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{storageStatus.lastError}</span>
          </div>
        ) : null}

        {activeSection === 'notes' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(event) => onCreateNote?.(event.currentTarget)}
              title="Create new note"
              className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              Create new note
            </button>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink"
            >
              Storage guide
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink"
            >
              Support
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyEditorState;
