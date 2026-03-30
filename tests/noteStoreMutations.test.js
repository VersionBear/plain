import { describe, expect, it } from 'vitest';
import {
  createNoteMutation,
  deleteTagMutation,
  renameTagMutation,
  trashNoteMutation,
  updateNoteMutation,
} from '../src/store/notesStore/mutations';

function makeState() {
  return {
    notes: [
      {
        id: 'note-1',
        title: 'First',
        content: '<p>Hello</p>',
        tags: ['alpha', 'beta'],
        pinned: false,
        createdAt: 1,
        updatedAt: 2,
        trashedAt: null,
      },
    ],
    trashedNotes: [],
    selectedNoteId: 'note-1',
    searchQuery: '',
    activeTag: 'alpha',
    activeSection: 'notes',
  };
}

describe('note store mutations', () => {
  it('creates a note in notes view and selects it', () => {
    const result = createNoteMutation(makeState(), {
      id: 'note-2',
      title: '',
      content: '',
      tags: [],
      pinned: false,
      createdAt: 3,
      updatedAt: 3,
      trashedAt: null,
    });

    expect(result.nextState.activeSection).toBe('notes');
    expect(result.nextState.activeTag).toBe('');
    expect(result.nextState.selectedNoteId).toBe('note-2');
  });

  it('updates note content and tags without mutating original state', () => {
    const state = makeState();
    const result = updateNoteMutation(state, 'note-1', {
      content: '<p>Updated</p>',
      tags: ['gamma'],
    });

    expect(result.updatedNote.content).toContain('Updated');
    expect(result.updatedNote.tags).toEqual(['gamma']);
    expect(state.notes[0].content).toContain('Hello');
  });

  it('moves a note into trash and clears active selection when needed', () => {
    const result = trashNoteMutation(makeState(), 'note-1');

    expect(result.nextState.notes).toHaveLength(0);
    expect(result.nextState.trashedNotes).toHaveLength(1);
    expect(result.nextState.selectedNoteId).toBe(null);
  });

  it('renames tags across matching notes', () => {
    const result = renameTagMutation(makeState(), 'alpha', 'renamed');

    expect(result.changedNotes).toHaveLength(1);
    expect(result.nextState.notes[0].tags).toContain('renamed');
    expect(result.nextState.activeTag).toBe('renamed');
  });

  it('deletes tags across matching notes and clears active tag', () => {
    const result = deleteTagMutation(makeState(), 'alpha');

    expect(result.changedNotes).toHaveLength(1);
    expect(result.nextState.notes[0].tags).toEqual(['beta']);
    expect(result.nextState.activeTag).toBe('');
  });
});
