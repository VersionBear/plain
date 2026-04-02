import { LIBRARY_VERSION } from './constants';
import { extractTagsFromContent, normalizeTags } from '../utils/notes';
import { sanitizeNoteHtml } from '../utils/noteMarkdown';

export function createEmptyIndex() {
  return {
    version: LIBRARY_VERSION,
    selectedNoteId: null,
    activeSection: 'notes',
    hasInitializedLibrary: false,
  };
}

export function normalizeNote(note, options = {}) {
  if (!note || typeof note !== 'object') {
    return null;
  }

  const fallbackTimestamp = Date.now();
  const createdAt = Number.isFinite(note.createdAt)
    ? note.createdAt
    : fallbackTimestamp;
  const updatedAt = Number.isFinite(note.updatedAt)
    ? note.updatedAt
    : createdAt;
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

  const hasExplicitTags = Object.prototype.hasOwnProperty.call(note, 'tags');
  const content =
    typeof note.content === 'string' ? sanitizeNoteHtml(note.content) : '';

  return {
    id: note.id,
    title: typeof note.title === 'string' ? note.title : '',
    content,
    tags: hasExplicitTags
      ? normalizeTags(note.tags, '', { allowContentFallback: false })
      : extractTagsFromContent(content),
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
  const indexSource =
    snapshot.index && typeof snapshot.index === 'object' ? snapshot.index : {};
  const index = {
    ...createEmptyIndex(),
    ...indexSource,
    version: LIBRARY_VERSION,
    activeSection: indexSource.activeSection === 'trash' ? 'trash' : 'notes',
    selectedNoteId:
      typeof indexSource.selectedNoteId === 'string' &&
      indexSource.selectedNoteId
        ? indexSource.selectedNoteId
        : null,
    hasInitializedLibrary:
      typeof indexSource.hasInitializedLibrary === 'boolean'
        ? indexSource.hasInitializedLibrary
        : Boolean(snapshot.index && typeof snapshot.index === 'object'),
  };

  return {
    notes: normalizeNotes(snapshot.notes, { trashed: false }),
    trashedNotes: normalizeNotes(snapshot.trashedNotes ?? snapshot.trash, {
      trashed: true,
    }),
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
    hasInitializedLibrary: true,
  };
}
