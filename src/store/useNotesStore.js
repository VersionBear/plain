import { create } from 'zustand';
import {
  connectFolderStorage as requestFolderStorageConnection,
  getInitialStorageAdapter,
  getStorageCapabilities,
  hasStoredFolderConnection,
} from '../storage';
import { getFolderWatcher, stopFolderWatcher } from '../storage/fileWatcher';
import {
  createLegacyLocalStorageStorage,
  getLegacyImportSnapshot,
  markLegacyImportComplete,
} from '../storage/legacyLocalStorage';
import {
  useNotificationStore,
} from './useNotificationStore';
import { useConflictStore } from './useConflictStore';
import {
  detectNoteConflict,
  parseDiskNote,
} from './notesStore/conflictResolver';
import {
  makeEmptyNote,
  normalizeTag,
  normalizeTags,
  sortNotes,
  sortTrashedNotes,
} from '../utils/notes';
import {
  createWelcomeNotes,
  shouldSeedWelcomeNote,
} from '../utils/welcomeNote';
import {
  createNoteMutation,
  deleteNotePermanentlyMutation,
  deleteTagMutation,
  renameTagMutation,
  restoreNoteMutation,
  setActiveSectionMutation,
  setActiveTagMutation,
  togglePinnedMutation,
  trashNoteMutation,
  updateNoteMutation,
} from './notesStore/mutations';
import {
  getLibrarySnapshot,
  normalizeLoadedState,
} from './notesStore/selectors';
import {
  buildStorageStatus,
  clearSyncError,
  setSyncError,
} from './notesStore/storageStatus';
import { flushActiveEditorDrafts } from '../utils/editorDraftRegistry';
import {
  applyDraftRecoveryToLibrary,
  clearDraftRecoverySnapshot,
} from '../utils/draftRecovery';

const capabilities = getStorageCapabilities();
let activeStorageAdapter = null;
let hydrationPromise = null;
let pendingLegacyImport = null;

function getPendingImportCount() {
  return (
    (pendingLegacyImport?.notes.length ?? 0) +
    (pendingLegacyImport?.trashedNotes.length ?? 0)
  );
}

function buildStatus(adapter, overrides = {}) {
  return buildStorageStatus(
    adapter,
    capabilities,
    getPendingImportCount(),
    overrides,
  );
}

function getRollbackState(state) {
  return {
    notes: state.notes,
    trashedNotes: state.trashedNotes,
    selectedNoteId: state.selectedNoteId,
    activeTag: state.activeTag,
    activeSection: state.activeSection,
    hasInitializedLibrary: state.hasInitializedLibrary,
  };
}

async function persistIndexSnapshot(set, get) {
  if (!activeStorageAdapter) {
    return false;
  }

  try {
    await activeStorageAdapter.saveIndex({
      selectedNoteId: get().selectedNoteId,
      activeSection: get().activeSection,
      hasInitializedLibrary: get().hasInitializedLibrary,
    });
    clearSyncError(set);
    return true;
  } catch (error) {
    setSyncError(set, error);
    return false;
  }
}

async function safelyRunStorageWrite(set, operation) {
  if (!activeStorageAdapter) {
    return false;
  }

  try {
    await operation(activeStorageAdapter);
    clearSyncError(set);
    return true;
  } catch (error) {
    setSyncError(set, error);
    return false;
  }
}

async function reconcileStateWithStorage(set, get, rollbackState) {
  if (!activeStorageAdapter) {
    set(rollbackState);
    return false;
  }

  try {
    const library = await activeStorageAdapter.loadLibrary();
    const normalizedState = normalizeLoadedState(
      library,
      get().searchQuery,
      get().activeTag,
    );
    set(normalizedState);
    return true;
  } catch {
    set(rollbackState);
    return false;
  }
}

async function applyPersistedMutation({
  set,
  get,
  mutate,
  persist,
  persistIndex = false,
}) {
  const state = get();
  const rollbackState = getRollbackState(state);
  const result = mutate(state);

  if (!result) {
    return false;
  }

  set(result.nextState);

  const didPersist = await safelyRunStorageWrite(set, (storage) =>
    persist(storage, result),
  );

  if (!didPersist) {
    await reconcileStateWithStorage(set, get, rollbackState);
    return false;
  }

  if (persistIndex) {
    await persistIndexSnapshot(set, get);
  }

  return true;
}

export const useNotesStore = create((set, get) => ({
  notes: [],
  trashedNotes: [],
  selectedNoteId: null,
  searchQuery: '',
  activeTag: '',
  activeSection: 'notes',
  hasInitializedLibrary: false,
  isHydrated: false,
  storageStatus: buildStatus(null, { isHydrating: true }),
  async hydrateLibrary() {
    if (hydrationPromise) {
      return hydrationPromise;
    }

    set((state) => ({
      storageStatus: {
        ...state.storageStatus,
        isHydrating: true,
        lastError: '',
      },
    }));

    hydrationPromise = (async () => {
      try {
        activeStorageAdapter = await getInitialStorageAdapter();
      } catch (error) {
        activeStorageAdapter = createLegacyLocalStorageStorage();
        setSyncError(set, error);
      }

      let library;
      const hasStoredFolderHandle = capabilities.supportsFolderPicker
        ? await hasStoredFolderConnection().catch(() => false)
        : false;

      try {
        pendingLegacyImport =
          activeStorageAdapter?.kind === 'legacy'
            ? null
            : getLegacyImportSnapshot();
        library = await activeStorageAdapter.loadLibrary();
      } catch (error) {
        activeStorageAdapter = createLegacyLocalStorageStorage();
        pendingLegacyImport = null;
        library = await activeStorageAdapter.loadLibrary();
        setSyncError(set, error);
      }

      if (shouldSeedWelcomeNote(library, pendingLegacyImport)) {
        const welcomeNotes = createWelcomeNotes();
        const seededIndex = {
          ...library.index,
          activeSection: 'notes',
          selectedNoteId: welcomeNotes[0].id,
          hasInitializedLibrary: true,
        };

        try {
          for (const note of welcomeNotes) {
            await activeStorageAdapter.saveNote(note);
          }
          await activeStorageAdapter.saveIndex(seededIndex);
          library = {
            ...library,
            notes: welcomeNotes,
            trashedNotes: [],
            index: seededIndex,
          };
        } catch (error) {
          setSyncError(set, error);
          library = await activeStorageAdapter.loadLibrary().catch(() => library);
        }
      }

      const {
        library: recoveredLibrary,
        recoveredNote,
        didConsumeRecovery,
      } = applyDraftRecoveryToLibrary(library);

      library = recoveredLibrary;

      if (recoveredNote) {
        try {
          await activeStorageAdapter.saveNote(recoveredNote);
          await activeStorageAdapter.saveIndex(library.index);
          clearDraftRecoverySnapshot(recoveredNote.id);
        } catch (error) {
          setSyncError(set, error);
        }
      } else if (didConsumeRecovery) {
        clearDraftRecoverySnapshot();
      }

      const normalizedState = normalizeLoadedState(
        library,
        get().searchQuery,
        get().activeTag,
      );

      set({
        ...normalizedState,
        isHydrated: true,
        storageStatus: buildStatus(activeStorageAdapter, {
          hasStoredFolderHandle,
          isHydrating: false,
        }),
      });
    })().finally(() => {
      hydrationPromise = null;
    });

    return hydrationPromise;
  },
  async connectFolderStorage() {
    set((state) => ({
      storageStatus: {
        ...state.storageStatus,
        isConnectingFolder: true,
        lastError: '',
      },
    }));

    const previousAdapterKind = activeStorageAdapter?.kind ?? null;
    const previousSnapshot = getLibrarySnapshot(get());

    try {
      const folderStorage = await requestFolderStorageConnection();
      let nextLibrary = await folderStorage.loadLibrary();

      if (
        nextLibrary.notes.length === 0 &&
        nextLibrary.trashedNotes.length === 0 &&
        (previousSnapshot.notes.length > 0 ||
          previousSnapshot.trashedNotes.length > 0)
      ) {
        for (const note of previousSnapshot.notes) {
          await folderStorage.saveNote(note);
        }

        for (const note of previousSnapshot.trashedNotes) {
          await folderStorage.saveNote(note);
        }

        await folderStorage.saveIndex(previousSnapshot.index);
        nextLibrary = previousSnapshot;

        if (previousAdapterKind === 'legacy') {
          markLegacyImportComplete();
        }
      }

      activeStorageAdapter = folderStorage;
      pendingLegacyImport =
        previousAdapterKind === 'legacy' ? null : getLegacyImportSnapshot();

      const normalizedState = normalizeLoadedState(
        nextLibrary,
        get().searchQuery,
        get().activeTag,
      );

      set({
        ...normalizedState,
        storageStatus: buildStatus(folderStorage, {
          isConnectingFolder: false,
        }),
      });
    } catch (error) {
      set((state) => ({
        storageStatus: {
          ...state.storageStatus,
          isConnectingFolder: false,
          lastError:
            error instanceof Error
              ? error.message
              : 'Unable to connect the selected folder.',
        },
      }));
    }
  },
  async refreshLibrary(options = {}) {
    const { showNotifications = true, checkConflicts = true } = options;

    if (!activeStorageAdapter || activeStorageAdapter.kind !== 'folder') {
      if (showNotifications) {
        useNotificationStore.getState().showWarning(
          'Refresh is only available when using folder storage.',
        );
      }
      return false;
    }

    set((state) => ({
      storageStatus: {
        ...state.storageStatus,
        isRefreshing: true,
        lastError: '',
      },
    }));

    try {
      // Get root handle and read directory to check for conflicts
      const rootHandle = await activeStorageAdapter.getRootHandle();
      const notesDir = await rootHandle.getDirectoryHandle('notes', { create: true });
      
      // Build a map of current notes by stem (filename without .md)
      const currentNotesMap = new Map();
      const currentNotes = get().notes;
      for (const note of currentNotes) {
        currentNotesMap.set(note.id, note);
      }

      // Check for conflicts before loading
      let conflictsDetected = false;

      if (checkConflicts) {
        // Load the library once to get the metadata
        const library = await activeStorageAdapter.loadLibrary();
        const indexMetadata = library.index?.metadata || {};

        for await (const entry of notesDir.values()) {
          if (entry.kind !== 'file' || !entry.name.endsWith('.md')) continue;

          try {
            const file = await entry.getFile();
            const mdText = await file.text();
            const diskNote = parseDiskNote(mdText, entry.name, file.lastModified);

            // Try to find matching note by stem in index metadata
            for (const [id, meta] of Object.entries(indexMetadata)) {
              if (meta.stem === entry.name.slice(0, -3)) {
                const appNote = currentNotesMap.get(id);
                
                if (appNote) {
                  const conflict = detectNoteConflict(appNote, {
                    ...diskNote,
                    lastModified: file.lastModified,
                  });

                  if (conflict.hasConflict) {
                    useConflictStore.getState().setConflict(conflict);
                    conflictsDetected = true;
                  }
                }
                break;
              }
            }
          } catch {
            // Skip unreadable files
          }
        }
      }

      // Load the library regardless of conflicts
      const library = await activeStorageAdapter.loadLibrary();
      const normalizedState = normalizeLoadedState(
        library,
        get().searchQuery,
        get().activeTag,
      );

      set({
        ...normalizedState,
        storageStatus: {
          ...buildStatus(activeStorageAdapter),
          isRefreshing: false,
        },
      });

      // Reset the file watcher cache after manual refresh
      const watcher = getFolderWatcher();
      watcher.resetCache();

      if (showNotifications && !conflictsDetected) {
        useNotificationStore.getState().showSuccess('Notes refreshed from folder.');
      }

      return true;
    } catch (error) {
      set((state) => ({
        storageStatus: {
          ...state.storageStatus,
          isRefreshing: false,
          lastError: error instanceof Error ? error.message : 'Unable to refresh notes.',
        },
      }));

      if (showNotifications) {
        useNotificationStore.getState().showError(
          error instanceof Error ? error.message : 'Failed to refresh notes.',
        );
      }

      return false;
    }
  },
  startFileWatcher() {
    // Only start watcher if using folder storage
    if (!activeStorageAdapter || activeStorageAdapter.kind !== 'folder') {
      return;
    }

    // Stop any existing watcher
    stopFolderWatcher();

    const watcher = getFolderWatcher();

    // Get the root handle (it's async)
    activeStorageAdapter.getRootHandle().then((rootHandle) => {
      watcher.start(rootHandle, {
        onChange: async ({ changes: _changes }) => {
          // Auto-sync silently in the background - just refresh the library
          // No notification here to avoid spam from the app's own saves
          const library = await activeStorageAdapter.loadLibrary();
          const normalizedState = normalizeLoadedState(
            library,
            get().searchQuery,
            get().activeTag,
          );

          set({
            ...normalizedState,
          });
        },
        onError: (error) => {
          useNotificationStore.getState().showError(`File watcher error: ${error.message}`);
        },
      }).catch((error) => {
        useNotificationStore.getState().showError(`Failed to start file watcher: ${error.message}`);
      });
    }).catch((error) => {
      useNotificationStore.getState().showError(`Failed to get folder handle: ${error.message}`);
    });
  },
  stopFileWatcher() {
    stopFolderWatcher();
  },
  async importLegacyNotes() {
    if (
      !pendingLegacyImport ||
      !activeStorageAdapter ||
      activeStorageAdapter.kind === 'legacy'
    ) {
      return;
    }

    const state = get();
    const existingIds = new Set([
      ...state.notes.map((note) => note.id),
      ...state.trashedNotes.map((note) => note.id),
    ]);
    const notesToImport = pendingLegacyImport.notes.filter(
      (note) => !existingIds.has(note.id),
    );
    const trashedToImport = pendingLegacyImport.trashedNotes.filter(
      (note) => !existingIds.has(note.id),
    );
    const importedNotes = [];
    const importedTrashedNotes = [];

    for (const note of notesToImport) {
      const didSave = await safelyRunStorageWrite(set, (storage) =>
        storage.saveNote(note),
      );

      if (didSave) {
        importedNotes.push(note);
      }
    }

    for (const note of trashedToImport) {
      const didSave = await safelyRunStorageWrite(set, (storage) =>
        storage.saveNote(note),
      );

      if (didSave) {
        importedTrashedNotes.push(note);
      }
    }

    const importedNoteIds = new Set(importedNotes.map((note) => note.id));
    const importedTrashedNoteIds = new Set(
      importedTrashedNotes.map((note) => note.id),
    );
    const remainingLegacyNotes = pendingLegacyImport.notes.filter(
      (note) => !existingIds.has(note.id) && !importedNoteIds.has(note.id),
    );
    const remainingLegacyTrashedNotes = pendingLegacyImport.trashedNotes.filter(
      (note) =>
        !existingIds.has(note.id) && !importedTrashedNoteIds.has(note.id),
    );
    const importCompleted =
      remainingLegacyNotes.length === 0 &&
      remainingLegacyTrashedNotes.length === 0;

    if (importCompleted) {
      markLegacyImportComplete();
      pendingLegacyImport = null;
    } else {
      pendingLegacyImport = {
        ...pendingLegacyImport,
        notes: remainingLegacyNotes,
        trashedNotes: remainingLegacyTrashedNotes,
      };
    }

    set((current) => ({
      notes: sortNotes([...current.notes, ...importedNotes]),
      trashedNotes: sortTrashedNotes([
        ...current.trashedNotes,
        ...importedTrashedNotes,
      ]),
      storageStatus: {
        ...buildStatus(activeStorageAdapter),
        lastError: importCompleted ? '' : current.storageStatus.lastError,
      },
    }));

    await persistIndexSnapshot(set, get);
  },
  createNote(options = {}) {
    flushActiveEditorDrafts('create-note');

    const nextNote = makeEmptyNote(options.overrides);

    void applyPersistedMutation({
      set,
      get,
      mutate: (state) => createNoteMutation(state, nextNote),
      persist: (storage, result) => storage.saveNote(result.note),
      persistIndex: true,
    });
  },
  updateNote(noteId, updates, options = {}) {
    void applyPersistedMutation({
      set,
      get,
      mutate: (state) => updateNoteMutation(state, noteId, updates, options),
      persist: (storage, result) => storage.saveNote(result.updatedNote),
    });
  },
  async trashNote(noteId) {
    flushActiveEditorDrafts('trash-note');

    await applyPersistedMutation({
      set,
      get,
      mutate: (state) => trashNoteMutation(state, noteId),
      persist: (storage, result) => storage.trashNote(result.trashedNote),
      persistIndex: true,
    });
  },
  async restoreNote(noteId) {
    await applyPersistedMutation({
      set,
      get,
      mutate: (state) => restoreNoteMutation(state, noteId),
      persist: (storage, result) => storage.restoreNote(result.restoredNote),
      persistIndex: true,
    });
  },
  async deleteNotePermanently(noteId) {
    clearDraftRecoverySnapshot(noteId);

    await applyPersistedMutation({
      set,
      get,
      mutate: (state) => deleteNotePermanentlyMutation(state, noteId),
      persist: (storage, result) =>
        storage.deleteNotePermanently(result.noteId),
      persistIndex: true,
    });
  },
  togglePinned(noteId) {
    void applyPersistedMutation({
      set,
      get,
      mutate: (state) => togglePinnedMutation(state, noteId),
      persist: (storage, result) => storage.saveNote(result.updatedNote),
    });
  },
  selectNote(noteId) {
    if (get().selectedNoteId !== noteId) {
      flushActiveEditorDrafts('select-note');
    }

    set({ selectedNoteId: noteId });
    void persistIndexSnapshot(set, get);
  },
  addTagToNote(noteId, tag) {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) {
      return;
    }

    const state = get();
    const note =
      state.notes.find((entry) => entry.id === noteId) ??
      state.trashedNotes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    const nextTags = normalizeTags([...note.tags, normalizedTag], '', {
      allowContentFallback: false,
    });

    if (
      nextTags.length === note.tags.length &&
      nextTags.every((entry, index) => entry === note.tags[index])
    ) {
      return;
    }

    get().updateNote(noteId, { tags: nextTags });
  },
  removeTagFromNote(noteId, tag) {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) {
      return;
    }

    const state = get();
    const note =
      state.notes.find((entry) => entry.id === noteId) ??
      state.trashedNotes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    const nextTags = note.tags.filter((entry) => entry !== normalizedTag);

    if (nextTags.length === note.tags.length) {
      return;
    }

    get().updateNote(noteId, { tags: nextTags });
  },
  async renameTag(currentTag, nextTagLabel) {
    await applyPersistedMutation({
      set,
      get,
      mutate: (state) => renameTagMutation(state, currentTag, nextTagLabel),
      persist: (storage, result) =>
        Promise.all(result.changedNotes.map((note) => storage.saveNote(note))),
    });
  },
  async deleteTag(tag) {
    await applyPersistedMutation({
      set,
      get,
      mutate: (state) => deleteTagMutation(state, tag),
      persist: (storage, result) =>
        Promise.all(result.changedNotes.map((note) => storage.saveNote(note))),
    });
  },
  setActiveSection(activeSection) {
    flushActiveEditorDrafts('set-active-section');

    const result = setActiveSectionMutation(get(), activeSection);

    if (!result) {
      return;
    }

    set(result.nextState);
    void persistIndexSnapshot(set, get);
  },
  setSearchQuery(searchQuery) {
    set({ searchQuery });
  },
  setActiveTag(activeTag) {
    flushActiveEditorDrafts('set-active-tag');

    const result = setActiveTagMutation(get(), activeTag);

    if (!result) {
      return;
    }

    set(result.nextState);
  },
  async seedWelcomeNotes() {
    if (!activeStorageAdapter) return;

    const welcomeNotes = createWelcomeNotes();
    const state = get();
    
    // Only add notes that don't already exist by title in either Notes or Trash
    const finalNotesToSeed = welcomeNotes.filter(wn => 
      !state.notes.some(n => n.title === wn.title) &&
      !state.trashedNotes.some(n => n.title === wn.title)
    );

    if (finalNotesToSeed.length === 0) {
      // If the main welcome note already exists, just select it
      const existingNote = [...state.notes, ...state.trashedNotes].find(n => n.title === 'Welcome to Plain');
      if (existingNote) {
        if (existingNote.trashedAt) {
          useNotificationStore.getState().showWarning('Welcome notes are already in your Trash.');
          get().setActiveSection('trash');
        } else {
          get().setActiveSection('notes');
        }
        get().selectNote(existingNote.id);
      }
      return;
    }

    try {
      for (const note of finalNotesToSeed) {
        await activeStorageAdapter.saveNote(note);
      }
      
      const newNotes = sortNotes([...state.notes, ...finalNotesToSeed]);
      set({ 
        notes: newNotes,
        selectedNoteId: finalNotesToSeed[0].id,
        activeSection: 'notes',
        activeTag: ''
      });
      
      await persistIndexSnapshot(set, get);
      // Force a library refresh to ensure sync
      await get().refreshLibrary({ showNotifications: false, checkConflicts: false });
      
      useNotificationStore.getState().showSuccess('Welcome notes restored.');
    } catch (error) {
      setSyncError(set, error);
    }
  },
}));
