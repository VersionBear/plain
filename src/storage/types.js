import { LIBRARY_VERSION } from './constants';

export function createEmptyIndex() {
  return {
    version: LIBRARY_VERSION,
    selectedNoteId: null,
    activeSection: 'notes',
  };
}

export function normalizeNote(note, options = {}) {
  if (!note || typeof note !== 'object') {
    return null;
  }

  const fallbackTimestamp = Date.now();
  const createdAt = Number.isFinite(note.createdAt) ? note.createdAt : fallbackTimestamp;
  const updatedAt = Number.isFinite(note.updatedAt) ? note.updatedAt : createdAt;
  const requestedTrashState = options.trashed ?? false;
  const rawTrashedAt = note.trashedAt;
  const trashedAt =
    typeof rawTrashedAt === 'number' && Number.isFinite(rawTrashedAt)
      ? rawTrashedAt
      : requestedTrashState
        ? updatedAt
        : null;

  if (typeof note.id !== 'string' || !note.id.trim()) {
    return null;
  }

  return {
    id: note.id,
    title: typeof note.title === 'string' ? note.title : '',
    content: typeof note.content === 'string' ? note.content : '',
    pinned: Boolean(note.pinned),
    createdAt,
    updatedAt,
    trashedAt,
  };
}

export function normalizeNotes(notes, options = {}) {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes.map((note) => normalizeNote(note, options)).filter(Boolean);
}

export function normalizeLibrary(snapshot = {}) {
  const indexSource = snapshot.index && typeof snapshot.index === 'object' ? snapshot.index : {};
  const index = {
    ...createEmptyIndex(),
    ...indexSource,
    version: LIBRARY_VERSION,
    activeSection: indexSource.activeSection === 'trash' ? 'trash' : 'notes',
    selectedNoteId:
      typeof indexSource.selectedNoteId === 'string' && indexSource.selectedNoteId
        ? indexSource.selectedNoteId
        : null,
  };

  return {
    notes: normalizeNotes(snapshot.notes, { trashed: false }),
    trashedNotes: normalizeNotes(snapshot.trashedNotes ?? snapshot.trash, { trashed: true }),
    index,
  };
}

export function serializeIndex(index = {}) {
  return {
    ...createEmptyIndex(),
    ...index,
    version: LIBRARY_VERSION,
    activeSection: index.activeSection === 'trash' ? 'trash' : 'notes',
    selectedNoteId:
      typeof index.selectedNoteId === 'string' && index.selectedNoteId
        ? index.selectedNoteId
        : null,
  };
}
