import { create } from 'zustand';
import {
  connectFolderStorage as requestFolderStorageConnection,
  getInitialStorageAdapter,
  getStorageCapabilities,
  hasStoredFolderConnection,
} from '../storage';
import {
  createLegacyLocalStorageStorage,
  getLegacyImportSnapshot,
  markLegacyImportComplete,
} from '../storage/legacyLocalStorage';
import {
  makeEmptyNote,
  normalizeTag,
  normalizeTags,
  sortNotes,
  sortTrashedNotes,
} from '../utils/notes';
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
  createNote() {
    void applyPersistedMutation({
      set,
      get,
      mutate: (state) => createNoteMutation(state, makeEmptyNote()),
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
    const result = setActiveTagMutation(get(), activeTag);

    if (!result) {
      return;
    }

    set(result.nextState);
  },
}));
