/**
 * File system watcher for detecting external changes to notes.
 * Uses polling-based approach since FileSystemHandle observers are not widely supported.
 */

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds
const MIN_POLL_INTERVAL = 2000;
const MAX_POLL_INTERVAL = 30000;

class FolderWatcher {
  constructor() {
    this._pollInterval = DEFAULT_POLL_INTERVAL;
    this._pollTimer = null;
    this._fileMetaCache = new Map(); // filename -> { lastModified, size }
    this._reportedChanges = new Set(); // Track files already reported
    this._appSavedFiles = new Map(); // fileName -> timestamp (suppress these)
    this._onFileChange = null;
    this._onError = null;
    this._rootHandle = null;
    this._notesDirHandle = null;
    this._trashDirHandle = null;
    this._isRunning = false;
    this._debounceTimer = null;
    this._pendingChanges = new Set();
  }

  /**
   * Start watching the folder for changes.
   * @param {FileSystemDirectoryHandle} rootHandle - The root plain-data folder handle
   * @param {Object} options
   * @param {Function} options.onChange - Called when changes are detected
   * @param {Function} options.onError - Called on errors
   * @param {number} options.pollInterval - Poll interval in milliseconds
   */
  async start(rootHandle, { onChange, onError, pollInterval = DEFAULT_POLL_INTERVAL } = {}) {
    this._rootHandle = rootHandle;
    this._onFileChange = onChange;
    this._onError = onError;
    this._pollInterval = Math.max(MIN_POLL_INTERVAL, Math.min(MAX_POLL_INTERVAL, pollInterval));

    if (this._isRunning) {
      this.stop();
    }

    try {
      const { notesDir, trashDir } = await this._ensureLibraryDirectories(rootHandle);
      this._notesDirHandle = notesDir;
      this._trashDirHandle = trashDir;

      // Initial scan to populate cache
      await this._scanDirectory(notesDir, 'notes');
      await this._scanDirectory(trashDir, 'trash');

      this._isRunning = true;
      this._startPolling();
    } catch (error) {
      this._onError?.(error);
    }
  }

  stop() {
    this._isRunning = false;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._pendingChanges.clear();
    this._reportedChanges.clear();
  }

  /**
   * Immediately scan for changes and return detected changes.
   * Useful for manual refresh.
   */
  async scanForChanges() {
    if (!this._notesDirHandle || !this._trashDirHandle) {
      return { changes: [], hasChanges: false };
    }

    const changes = [];

    const notesChanges = await this._scanDirectory(this._notesDirHandle, 'notes', true);
    const trashChanges = await this._scanDirectory(this._trashDirHandle, 'trash', true);

    changes.push(...notesChanges, ...trashChanges);

    return {
      changes,
      hasChanges: changes.length > 0,
    };
  }

  /**
   * Reset the file metadata cache. Useful after manual refresh.
   */
  resetCache() {
    this._fileMetaCache.clear();
    this._reportedChanges.clear();
    this._appSavedFiles.clear();
  }

  /**
   * Mark a file as recently saved by the app itself.
   * This suppresses "external change" notifications for app-initiated saves.
   */
  markFileAsAppSaved(fileName) {
    this._appSavedFiles.set(fileName, Date.now());
    // Also update the cache so we don't detect this as a change
    const cached = this._fileMetaCache.get(fileName);
    if (cached) {
      // Refresh the cached metadata for this file
      this._fileMetaCache.set(fileName, { ...cached, lastModified: Date.now() });
    }
  }

  /**
   * Clean up old app-saved entries (older than 10 seconds)
   */
  _cleanupAppSavedFiles() {
    const now = Date.now();
    for (const [fileName, timestamp] of this._appSavedFiles.entries()) {
      if (now - timestamp > 10000) {
        this._appSavedFiles.delete(fileName);
      }
    }
  }

  _startPolling() {
    if (!this._isRunning) return;

    this._pollTimer = setTimeout(async () => {
      try {
        await this._checkForChanges();
      } catch (error) {
        this._onError?.(error);
      }
      this._startPolling();
    }, this._pollInterval);
  }

  async _checkForChanges() {
    if (!this._notesDirHandle || !this._trashDirHandle) return;

    // Clean up old app-saved entries
    this._cleanupAppSavedFiles();

    const changes = [];

    const notesChanges = await this._scanDirectory(this._notesDirHandle, 'notes', true);
    const trashChanges = await this._scanDirectory(this._trashDirHandle, 'trash', true);

    changes.push(...notesChanges, ...trashChanges);

    if (changes.length > 0) {
      // Filter out already-reported changes AND app-initiated saves
      const now = Date.now();
      const newChanges = changes.filter((c) => {
        // Skip if already reported
        if (this._reportedChanges.has(c.fileName)) return false;
        // Skip if recently saved by the app (within last 3 seconds)
        const appSavedAt = this._appSavedFiles.get(c.fileName);
        if (appSavedAt && now - appSavedAt < 3000) return false;
        return true;
      });

      if (newChanges.length > 0) {
        // Debounce rapid changes
        for (const change of newChanges) {
          this._pendingChanges.add(change.fileName);
          this._reportedChanges.add(change.fileName);
        }

        if (this._debounceTimer) {
          clearTimeout(this._debounceTimer);
        }

        this._debounceTimer = setTimeout(() => {
          const changesToReport = Array.from(this._pendingChanges).map((fileName) => {
            return this._fileMetaCache.get(fileName)
              ? { fileName, type: 'modified', directory: this._fileMetaCache.get(fileName).directory }
              : { fileName, type: 'unknown', directory: 'notes' };
          });

          this._pendingChanges.clear();
          this._onFileChange?.({ changes: changesToReport, hasChanges: true });
        }, 500); // 500ms debounce
      }
    }
  }

  async _scanDirectory(dirHandle, directory, detectChanges = false) {
    const changes = [];
    const currentFiles = new Map(); // fileName -> { lastModified, size }

    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind !== 'file' || !entry.name.endsWith('.md')) continue;

        try {
          const file = await entry.getFile();
          const meta = {
            lastModified: file.lastModified,
            size: file.size,
            directory,
          };
          currentFiles.set(entry.name, meta);

          const cachedMeta = this._fileMetaCache.get(entry.name);

          if (detectChanges && cachedMeta) {
            // Check if file has changed
            if (
              cachedMeta.lastModified !== file.lastModified ||
              cachedMeta.size !== file.size
            ) {
              changes.push({
                fileName: entry.name,
                type: 'modified',
                directory,
                previousMeta: cachedMeta,
                currentMeta: meta,
                fileHandle: entry,
                lastModified: file.lastModified,
              });
            }
          }
        } catch {
          // Skip files we can't read
        }
      }

      // Check for deleted files
      if (detectChanges) {
        for (const [fileName, meta] of this._fileMetaCache.entries()) {
          if (meta.directory === directory && !currentFiles.has(fileName)) {
            changes.push({
              fileName,
              type: 'deleted',
              directory,
              previousMeta: meta,
            });
          }
        }
      }

      // Update cache for this directory
      if (detectChanges) {
        // Remove old entries for this directory
        for (const [fileName, meta] of this._fileMetaCache.entries()) {
          if (meta.directory === directory) {
            this._fileMetaCache.delete(fileName);
          }
        }
        // Add current files
        for (const [fileName, meta] of currentFiles.entries()) {
          this._fileMetaCache.set(fileName, meta);
        }
      } else {
        // Initial population
        for (const [fileName, meta] of currentFiles.entries()) {
          this._fileMetaCache.set(fileName, meta);
        }
      }
    } catch {
      // Directory might not be accessible
    }

    return changes;
  }

  async _ensureLibraryDirectories(rootHandle) {
    const notesDir = await rootHandle.getDirectoryHandle('notes', { create: true });
    const trashDir = await rootHandle.getDirectoryHandle('trash', { create: true });
    return { notesDir, trashDir };
  }
}

// Singleton instance
let watcherInstance = null;

export function getFolderWatcher() {
  if (!watcherInstance) {
    watcherInstance = new FolderWatcher();
  }
  return watcherInstance;
}

export function stopFolderWatcher() {
  if (watcherInstance) {
    watcherInstance.stop();
    watcherInstance = null;
  }
}
