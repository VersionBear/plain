import {
  filterNotesByTag,
  getNextSelectedNoteId,
  sortNotes,
  sortTrashedNotes,
} from '../../utils/notes';

export function getCollection(
  state,
  section = state.activeSection,
  options = {},
) {
  const collection = section === 'trash' ? state.trashedNotes : state.notes;

  if (section === 'trash' || options.includeTagFilter === false) {
    return collection;
  }

  return filterNotesByTag(collection, state.activeTag);
}

export function getSortFnForSection(section) {
  return section === 'trash' ? sortTrashedNotes : sortNotes;
}

export function resolveSelectedNoteId(
  notes,
  activeSection,
  selectedNoteId,
  searchQuery = '',
) {
  if (notes.some((note) => note.id === selectedNoteId)) {
    return selectedNoteId;
  }

  return getNextSelectedNoteId(
    notes,
    searchQuery,
    getSortFnForSection(activeSection),
  );
}

export function getLibrarySnapshot(state) {
  return {
    notes: state.notes,
    trashedNotes: state.trashedNotes,
    index: {
      selectedNoteId: state.selectedNoteId,
      activeSection: state.activeSection,
      hasInitializedLibrary: state.hasInitializedLibrary,
    },
  };
}

export function normalizeLoadedState(
  library,
  searchQuery = '',
  activeTag = '',
) {
  const notes = sortNotes(library.notes);
  const trashedNotes = sortTrashedNotes(library.trashedNotes);
  const activeSection =
    library.index.activeSection === 'trash' ? 'trash' : 'notes';
  const visibleNotes = filterNotesByTag(notes, activeTag);
  const selectedNoteId = resolveSelectedNoteId(
    activeSection === 'trash' ? trashedNotes : visibleNotes,
    activeSection,
    library.index.selectedNoteId,
    searchQuery,
  );

  return {
    notes,
    trashedNotes,
    activeSection,
    selectedNoteId,
    hasInitializedLibrary: Boolean(library.index.hasInitializedLibrary),
  };
}
