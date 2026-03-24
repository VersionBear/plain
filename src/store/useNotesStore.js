import { create } from 'zustand';
import {
  connectFolderStorage as requestFolderStorageConnection,
  getInitialStorageAdapter,
  getStorageCapabilities,
} from '../storage';
import {
  createLegacyLocalStorageStorage,
  getLegacyImportSnapshot,
  markLegacyImportComplete,
} from '../storage/legacyLocalStorage';
import {
  getNextSelectedNoteId,
  makeEmptyNote,
  sortNotes,
  sortTrashedNotes,
} from '../utils/notes';

const capabilities = getStorageCapabilities();
let activeStorageAdapter = null;
let hydrationPromise = null;
let pendingLegacyImport = null;

function getCollection(state, section = state.activeSection) {
  return section === 'trash' ? state.trashedNotes : state.notes;
}

function getSortFnForSection(section) {
  return section === 'trash' ? sortTrashedNotes : sortNotes;
}

function resolveSelectedNoteId(notes, activeSection, selectedNoteId, searchQuery = '') {
  if (notes.some((note) => note.id === selectedNoteId)) {
    return selectedNoteId;
  }

  return getNextSelectedNoteId(notes, searchQuery, getSortFnForSection(activeSection));
}

function getStorageLabel(adapter) {
  if (!adapter) {
    return 'Loading storage';
  }

  if (adapter.kind === 'folder') {
    return 'Stored in folder';
  }

  return capabilities.supportsFolderPicker ? 'Folder not connected' : 'Stored in browser';
}

function getStorageDescription(adapter) {
  if (!adapter) {
    return 'Opening your notes.';
  }

  if (adapter.kind === 'folder') {
    return 'Notes save into the folder you chose, with deleted notes moved to Trash.';
  }

  if (adapter.kind === 'opfs') {
    return capabilities.supportsFolderPicker
      ? 'Notes are safe in browser storage until you connect a real folder.'
      : 'Notes are stored in browser-managed device storage.';
  }

  return 'Notes are stored in local browser storage on this device.';
}

function getPendingImportCount() {
  return (pendingLegacyImport?.notes.length ?? 0) + (pendingLegacyImport?.trashedNotes.length ?? 0);
}

function buildStorageStatus(adapter, overrides = {}) {
  return {
    kind: adapter?.kind ?? 'unknown',
    label: getStorageLabel(adapter),
    detail: getStorageDescription(adapter),
    supportsFolderPicker: capabilities.supportsFolderPicker,
    hasFolderConnection: adapter?.kind === 'folder',
    isHydrating: false,
    isConnectingFolder: false,
    lastError: '',
    pendingImportCount: getPendingImportCount(),
    ...overrides,
  };
}

function getLibrarySnapshot(state) {
  return {
    notes: state.notes,
    trashedNotes: state.trashedNotes,
    index: {
      selectedNoteId: state.selectedNoteId,
      activeSection: state.activeSection,
    },
  };
}

function normalizeLoadedState(library, searchQuery = '') {
  const notes = sortNotes(library.notes);
  const trashedNotes = sortTrashedNotes(library.trashedNotes);
  const activeSection = library.index.activeSection === 'trash' ? 'trash' : 'notes';
  const selectedNoteId = resolveSelectedNoteId(
    activeSection === 'trash' ? trashedNotes : notes,
    activeSection,
    library.index.selectedNoteId,
    searchQuery,
  );

  return {
    notes,
    trashedNotes,
    activeSection,
    selectedNoteId,
  };
}

function setSyncError(set, error) {
  const message = error instanceof Error ? error.message : 'Something went wrong while saving your notes.';

  set((state) => ({
    storageStatus: {
      ...state.storageStatus,
      lastError: message,
    },
  }));
}

function clearSyncError(set) {
  set((state) => {
    if (!state.storageStatus.lastError) {
      return state;
    }

    return {
      storageStatus: {
        ...state.storageStatus,
        lastError: '',
      },
    };
  });
}

async function persistIndexSnapshot(set, get) {
  if (!activeStorageAdapter) {
    return;
  }

  try {
    await activeStorageAdapter.saveIndex({
      selectedNoteId: get().selectedNoteId,
      activeSection: get().activeSection,
    });
    clearSyncError(set);
  } catch (error) {
    setSyncError(set, error);
  }
}

async function safelyRunStorageWrite(set, operation) {
  if (!activeStorageAdapter) {
    return;
  }

  try {
    await operation(activeStorageAdapter);
    clearSyncError(set);
  } catch (error) {
    setSyncError(set, error);
  }
}

export const useNotesStore = create((set, get) => ({
  notes: [],
  trashedNotes: [],
  selectedNoteId: null,
  searchQuery: '',
  activeSection: 'notes',
  isHydrated: false,
  storageStatus: buildStorageStatus(null, { isHydrating: true }),
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

      try {
        pendingLegacyImport =
          activeStorageAdapter?.kind === 'legacy' ? null : getLegacyImportSnapshot();
        library = await activeStorageAdapter.loadLibrary();
      } catch (error) {
        activeStorageAdapter = createLegacyLocalStorageStorage();
        pendingLegacyImport = null;
        library = await activeStorageAdapter.loadLibrary();
        setSyncError(set, error);
      }

      const normalizedState = normalizeLoadedState(library, get().searchQuery);

      set({
        ...normalizedState,
        isHydrated: true,
        storageStatus: buildStorageStatus(activeStorageAdapter, {
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
        (previousSnapshot.notes.length > 0 || previousSnapshot.trashedNotes.length > 0)
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

      const normalizedState = normalizeLoadedState(nextLibrary, get().searchQuery);

      set({
        ...normalizedState,
        storageStatus: buildStorageStatus(folderStorage, {
          isConnectingFolder: false,
        }),
      });
    } catch (error) {
      set((state) => ({
        storageStatus: {
          ...state.storageStatus,
          isConnectingFolder: false,
          lastError:
            error instanceof Error ? error.message : 'Unable to connect the selected folder.',
        },
      }));
    }
  },
  async importLegacyNotes() {
    if (!pendingLegacyImport || !activeStorageAdapter || activeStorageAdapter.kind === 'legacy') {
      return;
    }

    const state = get();
    const existingIds = new Set([
      ...state.notes.map((note) => note.id),
      ...state.trashedNotes.map((note) => note.id),
    ]);
    const notesToImport = pendingLegacyImport.notes.filter((note) => !existingIds.has(note.id));
    const trashedToImport = pendingLegacyImport.trashedNotes.filter((note) => !existingIds.has(note.id));

    for (const note of notesToImport) {
      await safelyRunStorageWrite(set, (storage) => storage.saveNote(note));
    }

    for (const note of trashedToImport) {
      await safelyRunStorageWrite(set, (storage) => storage.saveNote(note));
    }

    markLegacyImportComplete();
    pendingLegacyImport = null;

    set((current) => ({
      notes: sortNotes([...current.notes, ...notesToImport]),
      trashedNotes: sortTrashedNotes([...current.trashedNotes, ...trashedToImport]),
      storageStatus: buildStorageStatus(activeStorageAdapter),
    }));

    await persistIndexSnapshot(set, get);
  },
  createNote() {
    const note = makeEmptyNote();

    set((state) => ({
      activeSection: 'notes',
      notes: sortNotes([note, ...state.notes]),
      selectedNoteId: note.id,
    }));

    void safelyRunStorageWrite(set, (storage) => storage.saveNote(note));
    void persistIndexSnapshot(set, get);
  },
  updateNote(noteId, updates, options = {}) {
    const state = get();
    const section = state.notes.some((note) => note.id === noteId) ? 'notes' : 'trash';
    const collection = section === 'notes' ? state.notes : state.trashedNotes;
    const targetNote = collection.find((note) => note.id === noteId);

    if (!targetNote) {
      return;
    }

    const nextTitle = updates.title ?? targetNote.title;
    const nextContent = updates.content ?? targetNote.content;
    const nextPinned = updates.pinned ?? targetNote.pinned;
    const nextTrashedAt = updates.trashedAt ?? targetNote.trashedAt;
    const titleChanged = nextTitle !== targetNote.title;
    const contentChanged = nextContent !== targetNote.content;
    const pinnedChanged = nextPinned !== targetNote.pinned;
    const trashChanged = nextTrashedAt !== targetNote.trashedAt;

    if (!titleChanged && !contentChanged && !pinnedChanged && !trashChanged) {
      return;
    }

    const touchUpdatedAt = options.touchUpdatedAt ?? true;
    const updatedNote = {
      ...targetNote,
      ...updates,
      updatedAt: touchUpdatedAt ? Date.now() : targetNote.updatedAt,
    };

    set((current) => ({
      notes:
        section === 'notes'
          ? sortNotes(current.notes.map((note) => (note.id === noteId ? updatedNote : note)))
          : current.notes,
      trashedNotes:
        section === 'trash'
          ? sortTrashedNotes(
              current.trashedNotes.map((note) => (note.id === noteId ? updatedNote : note)),
            )
          : current.trashedNotes,
    }));

    void safelyRunStorageWrite(set, (storage) => storage.saveNote(updatedNote));
  },
  async trashNote(noteId) {
    const state = get();
    const note = state.notes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    const trashedNote = {
      ...note,
      trashedAt: Date.now(),
    };
    const remainingNotes = state.notes.filter((entry) => entry.id !== noteId);
    const nextSelectedNoteId =
      state.activeSection === 'notes'
        ? resolveSelectedNoteId(
            remainingNotes,
            'notes',
            state.selectedNoteId === noteId ? null : state.selectedNoteId,
            state.searchQuery,
          )
        : state.selectedNoteId;

    set({
      notes: sortNotes(remainingNotes),
      trashedNotes: sortTrashedNotes([trashedNote, ...state.trashedNotes]),
      selectedNoteId: nextSelectedNoteId,
    });

    await safelyRunStorageWrite(set, (storage) => storage.trashNote(trashedNote));
    await persistIndexSnapshot(set, get);
  },
  async restoreNote(noteId) {
    const state = get();
    const note = state.trashedNotes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    const restoredNote = {
      ...note,
      trashedAt: null,
      updatedAt: Date.now(),
    };
    const remainingTrashedNotes = state.trashedNotes.filter((entry) => entry.id !== noteId);
    const nextSelectedNoteId =
      state.activeSection === 'trash'
        ? resolveSelectedNoteId(
            remainingTrashedNotes,
            'trash',
            state.selectedNoteId === noteId ? null : state.selectedNoteId,
            state.searchQuery,
          )
        : state.selectedNoteId;

    set({
      notes: sortNotes([restoredNote, ...state.notes]),
      trashedNotes: sortTrashedNotes(remainingTrashedNotes),
      selectedNoteId: nextSelectedNoteId,
    });

    await safelyRunStorageWrite(set, (storage) => storage.restoreNote(restoredNote));
    await persistIndexSnapshot(set, get);
  },
  async deleteNotePermanently(noteId) {
    const state = get();
    const remainingTrashedNotes = state.trashedNotes.filter((entry) => entry.id !== noteId);
    const nextSelectedNoteId =
      state.activeSection === 'trash'
        ? resolveSelectedNoteId(
            remainingTrashedNotes,
            'trash',
            state.selectedNoteId === noteId ? null : state.selectedNoteId,
            state.searchQuery,
          )
        : state.selectedNoteId;

    set({
      trashedNotes: sortTrashedNotes(remainingTrashedNotes),
      selectedNoteId: nextSelectedNoteId,
    });

    await safelyRunStorageWrite(set, (storage) => storage.deleteNotePermanently(noteId));
    await persistIndexSnapshot(set, get);
  },
  togglePinned(noteId) {
    const state = get();
    const note = state.notes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    const updatedNote = {
      ...note,
      pinned: !note.pinned,
      updatedAt: Date.now(),
    };

    set((current) => ({
      notes: sortNotes(current.notes.map((entry) => (entry.id === noteId ? updatedNote : entry))),
    }));

    void safelyRunStorageWrite(set, (storage) => storage.saveNote(updatedNote));
  },
  selectNote(noteId) {
    set({ selectedNoteId: noteId });
    void persistIndexSnapshot(set, get);
  },
  setActiveSection(activeSection) {
    const nextSection = activeSection === 'trash' ? 'trash' : 'notes';
    const state = get();
    const nextCollection = getCollection(state, nextSection);
    const nextSelectedNoteId = resolveSelectedNoteId(
      nextCollection,
      nextSection,
      nextSection === state.activeSection ? state.selectedNoteId : null,
      state.searchQuery,
    );

    set({
      activeSection: nextSection,
      selectedNoteId: nextSelectedNoteId,
    });

    void persistIndexSnapshot(set, get);
  },
  setSearchQuery(searchQuery) {
    set({ searchQuery });
  },
}));
