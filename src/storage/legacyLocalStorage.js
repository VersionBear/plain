import {
  LEGACY_IMPORT_FLAG_KEY,
  LEGACY_LIBRARY_KEY,
  LEGACY_STORAGE_KEY,
} from './constants';
import { createEmptyIndex, normalizeLibrary, normalizeNote, serializeIndex } from './types';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJsonStorageValue(storageKey) {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function extractLegacyPersistedState(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }

  if (rawValue.state && typeof rawValue.state === 'object') {
    return rawValue.state;
  }

  if (Array.isArray(rawValue.notes)) {
    return rawValue;
  }

  return null;
}

function readFallbackLibrarySnapshot() {
  const storedLibrary = readJsonStorageValue(LEGACY_LIBRARY_KEY);

  if (storedLibrary) {
    return normalizeLibrary(storedLibrary);
  }

  const legacyState = extractLegacyPersistedState(readJsonStorageValue(LEGACY_STORAGE_KEY));

  if (!legacyState) {
    return normalizeLibrary({ index: createEmptyIndex(), notes: [], trashedNotes: [] });
  }

  return normalizeLibrary({
    index: {
      selectedNoteId:
        typeof legacyState.selectedNoteId === 'string' ? legacyState.selectedNoteId : null,
      activeSection: 'notes',
    },
    notes: Array.isArray(legacyState.notes) ? legacyState.notes : [],
    trashedNotes: [],
  });
}

function persistFallbackLibrary(library) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    LEGACY_LIBRARY_KEY,
    JSON.stringify({
      notes: library.notes,
      trashedNotes: library.trashedNotes,
      index: serializeIndex(library.index),
    }),
  );
}

function upsertNote(notes, note, options = {}) {
  const normalized = normalizeNote(note, options);

  if (!normalized) {
    return notes;
  }

  const remaining = notes.filter((entry) => entry.id !== normalized.id);
  return [...remaining, normalized];
}

function removeNote(notes, noteId) {
  return notes.filter((entry) => entry.id !== noteId);
}

export function createLegacyLocalStorageStorage() {
  let writeQueue = Promise.resolve();

  const runExclusive = (operation) => {
    const nextOperation = writeQueue.catch(() => undefined).then(async () => {
      const currentLibrary = readFallbackLibrarySnapshot();
      const nextLibrary = normalizeLibrary(await operation(currentLibrary));
      persistFallbackLibrary(nextLibrary);
      return nextLibrary;
    });

    writeQueue = nextOperation.catch(() => undefined);
    return nextOperation;
  };

  return {
    kind: 'legacy',
    supportsUserVisibleFolder: false,
    async loadLibrary() {
      return readFallbackLibrarySnapshot();
    },
    saveNote(note) {
      return runExclusive((library) => ({
        ...library,
        notes: upsertNote(removeNote(library.notes, note.id), { ...note, trashedAt: null }, { trashed: false }),
        trashedNotes: removeNote(library.trashedNotes, note.id),
      }));
    },
    trashNote(note) {
      const trashedNote = {
        ...note,
        trashedAt:
          typeof note?.trashedAt === 'number' && Number.isFinite(note.trashedAt)
            ? note.trashedAt
            : Date.now(),
      };

      return runExclusive((library) => ({
        ...library,
        notes: removeNote(library.notes, note.id),
        trashedNotes: upsertNote(removeNote(library.trashedNotes, note.id), trashedNote, { trashed: true }),
      }));
    },
    restoreNote(note) {
      const restoredNote = {
        ...note,
        trashedAt: null,
        updatedAt: Date.now(),
      };

      return runExclusive((library) => ({
        ...library,
        notes: upsertNote(removeNote(library.notes, note.id), restoredNote, { trashed: false }),
        trashedNotes: removeNote(library.trashedNotes, note.id),
      }));
    },
    deleteNotePermanently(noteId) {
      return runExclusive((library) => ({
        ...library,
        trashedNotes: removeNote(library.trashedNotes, noteId),
      }));
    },
    saveIndex(index) {
      return runExclusive((library) => ({
        ...library,
        index: {
          ...library.index,
          ...serializeIndex(index),
        },
      }));
    },
  };
}

export function getLegacyImportSnapshot() {
  if (!canUseLocalStorage() || window.localStorage.getItem(LEGACY_IMPORT_FLAG_KEY) === 'true') {
    return null;
  }

  const legacyState = extractLegacyPersistedState(readJsonStorageValue(LEGACY_STORAGE_KEY));

  if (!legacyState || !Array.isArray(legacyState.notes) || legacyState.notes.length === 0) {
    return null;
  }

  return normalizeLibrary({
    index: {
      selectedNoteId:
        typeof legacyState.selectedNoteId === 'string' ? legacyState.selectedNoteId : null,
      activeSection: 'notes',
    },
    notes: legacyState.notes,
    trashedNotes: [],
  });
}

export function markLegacyImportComplete() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(LEGACY_IMPORT_FLAG_KEY, 'true');
}
