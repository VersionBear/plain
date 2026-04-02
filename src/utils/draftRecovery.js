const DRAFT_RECOVERY_STORAGE_KEY = 'plain-active-draft';
const DRAFT_RECOVERY_MAX_AGE_MS = 15 * 60 * 1000;

function canUseDraftRecoveryStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function normalizeDraftRecoveryRecord(record) {
  if (
    !record ||
    typeof record !== 'object' ||
    !record.note ||
    typeof record.note !== 'object'
  ) {
    return null;
  }

  const { note, savedAt } = record;

  if (!note.id || typeof note.id !== 'string') {
    return null;
  }

  return {
    savedAt:
      typeof savedAt === 'number' && Number.isFinite(savedAt)
        ? savedAt
        : Date.now(),
    note: {
      id: note.id,
      title: typeof note.title === 'string' ? note.title : '',
      content: typeof note.content === 'string' ? note.content : '',
      tags: Array.isArray(note.tags) ? note.tags : [],
      pinned: Boolean(note.pinned),
      createdAt:
        typeof note.createdAt === 'number' && Number.isFinite(note.createdAt)
          ? note.createdAt
          : Date.now(),
      updatedAt:
        typeof note.updatedAt === 'number' && Number.isFinite(note.updatedAt)
          ? note.updatedAt
          : Date.now(),
      trashedAt:
        typeof note.trashedAt === 'number' && Number.isFinite(note.trashedAt)
          ? note.trashedAt
          : null,
    },
  };
}

export function readDraftRecoverySnapshot() {
  if (!canUseDraftRecoveryStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(DRAFT_RECOVERY_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    return normalizeDraftRecoveryRecord(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function writeDraftRecoverySnapshot(note, overrides = {}) {
  if (!canUseDraftRecoveryStorage() || !note?.id) {
    return;
  }

  const now = Date.now();
  const record = {
    savedAt: now,
    note: {
      ...note,
      title: overrides.title ?? note.title ?? '',
      content: overrides.content ?? note.content ?? '',
      tags: Array.isArray(note.tags) ? note.tags : [],
      pinned: Boolean(note.pinned),
      createdAt:
        typeof note.createdAt === 'number' && Number.isFinite(note.createdAt)
          ? note.createdAt
          : now,
      updatedAt: now,
      trashedAt:
        typeof note.trashedAt === 'number' && Number.isFinite(note.trashedAt)
          ? note.trashedAt
          : null,
    },
  };

  try {
    window.localStorage.setItem(
      DRAFT_RECOVERY_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    // Ignore recovery cache failures. This is a last-resort safety net.
  }
}

export function clearDraftRecoverySnapshot(noteId = null) {
  if (!canUseDraftRecoveryStorage()) {
    return;
  }

  if (!noteId) {
    window.localStorage.removeItem(DRAFT_RECOVERY_STORAGE_KEY);
    return;
  }

  const currentRecord = readDraftRecoverySnapshot();

  if (currentRecord?.note.id === noteId) {
    window.localStorage.removeItem(DRAFT_RECOVERY_STORAGE_KEY);
  }
}

export function applyDraftRecoveryToLibrary(library, now = Date.now()) {
  const record = readDraftRecoverySnapshot();

  if (!record) {
    return {
      library,
      recoveredNote: null,
      didConsumeRecovery: false,
    };
  }

  if (now - record.savedAt > DRAFT_RECOVERY_MAX_AGE_MS) {
    clearDraftRecoverySnapshot(record.note.id);
    return {
      library,
      recoveredNote: null,
      didConsumeRecovery: false,
    };
  }

  const noteCollections = [
    ['notes', library.notes],
    ['trashedNotes', library.trashedNotes],
  ];

  for (const [collectionKey, collection] of noteCollections) {
    const existingNote = collection.find((note) => note.id === record.note.id);

    if (!existingNote) {
      continue;
    }

    const hasRecoveryChanges =
      existingNote.title !== record.note.title ||
      existingNote.content !== record.note.content ||
      existingNote.updatedAt < record.note.updatedAt;

    if (!hasRecoveryChanges) {
      return {
        library,
        recoveredNote: null,
        didConsumeRecovery: true,
      };
    }

    const recoveredNote = {
      ...existingNote,
      ...record.note,
      updatedAt: Math.max(existingNote.updatedAt, record.note.updatedAt),
    };

    return {
      library: {
        ...library,
        [collectionKey]: collection.map((note) =>
          note.id === recoveredNote.id ? recoveredNote : note,
        ),
        index: {
          ...library.index,
          selectedNoteId: recoveredNote.id,
          activeSection:
            collectionKey === 'trashedNotes' ? 'trash' : 'notes',
        },
      },
      recoveredNote,
      didConsumeRecovery: true,
    };
  }

  const recoveredNote = record.note;
  const targetCollectionKey = recoveredNote.trashedAt ? 'trashedNotes' : 'notes';

  return {
    library: {
      ...library,
      [targetCollectionKey]: [...library[targetCollectionKey], recoveredNote],
      index: {
        ...library.index,
        selectedNoteId: recoveredNote.id,
        activeSection: recoveredNote.trashedAt ? 'trash' : 'notes',
      },
    },
    recoveredNote,
    didConsumeRecovery: true,
  };
}
