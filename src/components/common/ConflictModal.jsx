import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Save, FolderOpen, Copy, X } from 'lucide-react';
import clsx from 'clsx';

function ConflictPreview({ note, label, icon: Icon }) {
  const contentPreview = (note.content || '')
    .replace(/<[^>]*>/g, '')
    .slice(0, 150);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line/40 bg-elevated/50 p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />}
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      </div>
      <p className="truncate text-sm font-medium text-ink">{note.title || 'Untitled'}</p>
      {contentPreview && (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted">{contentPreview}</p>
      )}
      <p className="text-[10px] text-muted/50">
        Last modified: {new Date(note.updatedAt || note.lastModified || Date.now()).toLocaleString()}
      </p>
    </div>
  );
}

export function ConflictResolutionModal({ conflict, onResolve, onClose }) {
  if (!conflict) return null;

  const { appNote, diskNote, diskIsNewer } = conflict;

  const handleResolve = (choice) => {
    onResolve(choice, appNote, diskNote);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full max-w-lg rounded-3xl border border-line/50 bg-panel shadow-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Resolve note conflict"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-line/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tightest text-ink">Conflict Detected</h2>
                <p className="text-sm text-muted">This note was changed in multiple places</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-2 text-muted/60 transition-colors hover:bg-line/30 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ConflictPreview
                note={appNote}
                label="App Version"
                icon={Save}
              />
              <ConflictPreview
                note={diskNote}
                label={diskIsNewer ? 'Disk Version (Newer)' : 'Disk Version'}
                icon={FolderOpen}
              />
            </div>

            {/* Resolution Options */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Choose how to resolve:</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleResolve('keep_app')}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                    'border-line/40 bg-elevated/30 hover:bg-elevated/50 hover:border-accent/40',
                  )}
                >
                  <Save className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-ink">Keep App Version</p>
                    <p className="text-xs text-muted">Discard disk changes and keep what you have in the app</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolve('keep_disk')}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                    'border-line/40 bg-elevated/30 hover:bg-elevated/50 hover:border-accent/40',
                  )}
                >
                  <FolderOpen className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-ink">Keep Disk Version</p>
                    <p className="text-xs text-muted">Overwrite app version with the file from disk</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolve('keep_both')}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                    'border-line/40 bg-elevated/30 hover:bg-elevated/50 hover:border-accent/40',
                  )}
                >
                  <Copy className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-ink">Keep Both (Duplicate)</p>
                    <p className="text-xs text-muted">Keep your app version and create a copy from disk</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
