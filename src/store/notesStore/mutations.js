import {
  filterNotesByTag,
  normalizeTag,
  normalizeTags,
  sortNotes,
  sortTrashedNotes,
} from '../../utils/notes';
import { getCollection, resolveSelectedNoteId } from './selectors';

export function areTagListsEqual(left = [], right = []) {
  return (
    left.length === right.length &&
    left.every((tag, index) => tag === right[index])
  );
}

export function createNoteMutation(state, note) {
  return {
    note,
    nextState: {
      activeSection: 'notes',
      activeTag: '',
      notes: sortNotes([note, ...state.notes]),
      selectedNoteId: note.id,
    },
  };
}

export function updateNoteMutation(state, noteId, updates, options = {}) {
  const section = state.notes.some((note) => note.id === noteId)
    ? 'notes'
    : 'trash';
  const collection = section === 'notes' ? state.notes : state.trashedNotes;
  const targetNote = collection.find((note) => note.id === noteId);

  if (!targetNote) {
    return null;
  }

  const nextTitle = updates.title ?? targetNote.title;
  const nextContent = updates.content ?? targetNote.content;
  const nextTags = Object.prototype.hasOwnProperty.call(updates, 'tags')
    ? normalizeTags(updates.tags, '', { allowContentFallback: false })
    : targetNote.tags;
  const nextPinned = updates.pinned ?? targetNote.pinned;
  const nextTrashedAt = updates.trashedAt ?? targetNote.trashedAt;
  const titleChanged = nextTitle !== targetNote.title;
  const contentChanged = nextContent !== targetNote.content;
  const tagsChanged = !areTagListsEqual(nextTags, targetNote.tags);
  const pinnedChanged = nextPinned !== targetNote.pinned;
  const trashChanged = nextTrashedAt !== targetNote.trashedAt;

  if (
    !titleChanged &&
    !contentChanged &&
    !tagsChanged &&
    !pinnedChanged &&
    !trashChanged
  ) {
    return null;
  }

  const touchUpdatedAt = options.touchUpdatedAt ?? true;
  const updatedNote = {
    ...targetNote,
    ...updates,
    tags: nextTags,
    updatedAt: touchUpdatedAt ? Date.now() : targetNote.updatedAt,
  };

  return {
    updatedNote,
    nextState: {
      notes:
        section === 'notes'
          ? sortNotes(
              state.notes.map((note) =>
                note.id === noteId ? updatedNote : note,
              ),
            )
          : state.notes,
      trashedNotes:
        section === 'trash'
          ? sortTrashedNotes(
              state.trashedNotes.map((note) =>
                note.id === noteId ? updatedNote : note,
              ),
            )
          : state.trashedNotes,
    },
  };
}

export function trashNoteMutation(state, noteId) {
  const note = state.notes.find((entry) => entry.id === noteId);

  if (!note) {
    return null;
  }

  const trashedNote = {
    ...note,
    trashedAt: Date.now(),
  };
  const remainingNotes = state.notes.filter((entry) => entry.id !== noteId);
  const visibleRemainingNotes = filterNotesByTag(
    remainingNotes,
    state.activeTag,
  );
  const nextSelectedNoteId =
    state.activeSection === 'notes'
      ? resolveSelectedNoteId(
          visibleRemainingNotes,
          'notes',
          state.selectedNoteId === noteId ? null : state.selectedNoteId,
          state.searchQuery,
        )
      : state.selectedNoteId;

  return {
    trashedNote,
    nextState: {
      notes: sortNotes(remainingNotes),
      trashedNotes: sortTrashedNotes([trashedNote, ...state.trashedNotes]),
      selectedNoteId: nextSelectedNoteId,
    },
  };
}

export function restoreNoteMutation(state, noteId) {
  const note = state.trashedNotes.find((entry) => entry.id === noteId);

  if (!note) {
    return null;
  }

  const restoredNote = {
    ...note,
    trashedAt: null,
    updatedAt: Date.now(),
  };
  const remainingTrashedNotes = state.trashedNotes.filter(
    (entry) => entry.id !== noteId,
  );
  const nextSelectedNoteId =
    state.activeSection === 'trash'
      ? resolveSelectedNoteId(
          remainingTrashedNotes,
          'trash',
          state.selectedNoteId === noteId ? null : state.selectedNoteId,
          state.searchQuery,
        )
      : state.selectedNoteId;

  return {
    restoredNote,
    nextState: {
      notes: sortNotes([restoredNote, ...state.notes]),
      trashedNotes: sortTrashedNotes(remainingTrashedNotes),
      selectedNoteId: nextSelectedNoteId,
    },
  };
}

export function deleteNotePermanentlyMutation(state, noteId) {
  const remainingTrashedNotes = state.trashedNotes.filter(
    (entry) => entry.id !== noteId,
  );
  const nextSelectedNoteId =
    state.activeSection === 'trash'
      ? resolveSelectedNoteId(
          remainingTrashedNotes,
          'trash',
          state.selectedNoteId === noteId ? null : state.selectedNoteId,
          state.searchQuery,
        )
      : state.selectedNoteId;

  return {
    noteId,
    nextState: {
      trashedNotes: sortTrashedNotes(remainingTrashedNotes),
      selectedNoteId: nextSelectedNoteId,
    },
  };
}

export function togglePinnedMutation(state, noteId) {
  const note = state.notes.find((entry) => entry.id === noteId);

  if (!note) {
    return null;
  }

  const updatedNote = {
    ...note,
    pinned: !note.pinned,
    updatedAt: Date.now(),
  };

  return {
    updatedNote,
    nextState: {
      notes: sortNotes(
        state.notes.map((entry) => (entry.id === noteId ? updatedNote : entry)),
      ),
    },
  };
}

function updateTaggedCollection(
  collection,
  tagTransformer,
  timestamp,
  changedNotes,
) {
  return collection.map((note) => {
    const nextTags = tagTransformer(note.tags);

    if (!nextTags || areTagListsEqual(nextTags, note.tags)) {
      return note;
    }

    const updatedNote = {
      ...note,
      tags: nextTags,
      updatedAt: timestamp,
    };

    changedNotes.push(updatedNote);
    return updatedNote;
  });
}

export function renameTagMutation(state, currentTag, nextTagLabel) {
  const previousTag = normalizeTag(currentTag);
  const nextTag = normalizeTag(nextTagLabel);

  if (!previousTag || !nextTag || previousTag === nextTag) {
    return null;
  }

  const changedNotes = [];
  const timestamp = Date.now();
  const nextNotes = updateTaggedCollection(
    state.notes,
    (tags) => {
      if (!tags.includes(previousTag)) {
        return null;
      }

      return normalizeTags(
        tags.map((tag) => (tag === previousTag ? nextTag : tag)),
        '',
        { allowContentFallback: false },
      );
    },
    timestamp,
    changedNotes,
  );
  const nextTrashedNotes = updateTaggedCollection(
    state.trashedNotes,
    (tags) => {
      if (!tags.includes(previousTag)) {
        return null;
      }

      return normalizeTags(
        tags.map((tag) => (tag === previousTag ? nextTag : tag)),
        '',
        { allowContentFallback: false },
      );
    },
    timestamp,
    changedNotes,
  );

  if (changedNotes.length === 0) {
    return null;
  }

  return {
    changedNotes,
    nextState: {
      notes: sortNotes(nextNotes),
      trashedNotes: sortTrashedNotes(nextTrashedNotes),
      activeTag: state.activeTag === previousTag ? nextTag : state.activeTag,
    },
  };
}

export function deleteTagMutation(state, tag) {
  const targetTag = normalizeTag(tag);

  if (!targetTag) {
    return null;
  }

  const changedNotes = [];
  const timestamp = Date.now();
  const nextNotes = updateTaggedCollection(
    state.notes,
    (tags) => {
      if (!tags.includes(targetTag)) {
        return null;
      }

      return tags.filter((entry) => entry !== targetTag);
    },
    timestamp,
    changedNotes,
  );
  const nextTrashedNotes = updateTaggedCollection(
    state.trashedNotes,
    (tags) => {
      if (!tags.includes(targetTag)) {
        return null;
      }

      return tags.filter((entry) => entry !== targetTag);
    },
    timestamp,
    changedNotes,
  );

  if (changedNotes.length === 0) {
    return null;
  }

  return {
    changedNotes,
    nextState: {
      notes: sortNotes(nextNotes),
      trashedNotes: sortTrashedNotes(nextTrashedNotes),
      activeTag: state.activeTag === targetTag ? '' : state.activeTag,
    },
  };
}

export function setActiveSectionMutation(state, activeSection) {
  const nextSection = activeSection === 'trash' ? 'trash' : 'notes';
  const nextCollection = getCollection(state, nextSection);
  const nextSelectedNoteId = resolveSelectedNoteId(
    nextCollection,
    nextSection,
    nextSection === state.activeSection ? state.selectedNoteId : null,
    state.searchQuery,
  );

  return {
    nextState: {
      activeSection: nextSection,
      selectedNoteId: nextSelectedNoteId,
    },
  };
}

export function setActiveTagMutation(state, activeTag) {
  const nextTag = normalizeTag(activeTag);

  if (state.activeTag === nextTag) {
    return null;
  }

  const nextSelectedNoteId =
    state.activeSection === 'notes'
      ? resolveSelectedNoteId(
          filterNotesByTag(state.notes, nextTag),
          'notes',
          state.selectedNoteId,
          state.searchQuery,
        )
      : state.selectedNoteId;

  return {
    nextState: {
      activeTag: nextTag,
      selectedNoteId: nextSelectedNoteId,
    },
  };
}
