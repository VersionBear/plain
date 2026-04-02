import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotesStore } from '../src/store/useNotesStore';
import {
  registerActiveEditorDrafts,
  flushActiveEditorDrafts,
} from '../src/utils/editorDraftRegistry';
import {
  flushEditorDraftsForLifecycle,
  removeVisibilityHandlers,
  setupVisibilityHandlers,
} from '../src/utils/visibilityHandler';

const baseNote = {
  id: 'note-a',
  title: 'A',
  content: '<p>Alpha</p>',
  tags: [],
  pinned: false,
  createdAt: 1,
  updatedAt: 1,
  trashedAt: null,
};

const secondaryNote = {
  ...baseNote,
  id: 'note-b',
  title: 'B',
  content: '<p>Beta</p>',
};

describe('editor draft lifecycle', () => {
  beforeEach(() => {
    useNotesStore.setState({
      notes: [baseNote, secondaryNote],
      trashedNotes: [],
      selectedNoteId: baseNote.id,
      searchQuery: '',
      activeTag: '',
      activeSection: 'notes',
      hasInitializedLibrary: true,
      isHydrated: true,
      storageStatus: useNotesStore.getState().storageStatus,
    });

    removeVisibilityHandlers();
  });

  it('flushes active editor drafts before switching notes', () => {
    const flushDrafts = vi.fn();
    const unregister = registerActiveEditorDrafts(baseNote.id, flushDrafts);

    useNotesStore.getState().selectNote(secondaryNote.id);

    expect(flushDrafts).toHaveBeenCalledWith('select-note');
    unregister();
  });

  it('flushes active editor drafts for lifecycle-driven saves', () => {
    const flushDrafts = vi.fn();
    const unregister = registerActiveEditorDrafts(baseNote.id, flushDrafts);

    flushActiveEditorDrafts('manual-test');
    flushEditorDraftsForLifecycle('visibilitychange');

    expect(flushDrafts).toHaveBeenNthCalledWith(1, 'manual-test');
    expect(flushDrafts).toHaveBeenNthCalledWith(2, 'visibilitychange');
    unregister();
  });

  it('flushes active editor drafts when the page is hidden', () => {
    const flushDrafts = vi.fn();
    const unregister = registerActiveEditorDrafts(baseNote.id, flushDrafts);

    let visibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });

    setupVisibilityHandlers();
    visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));

    expect(flushDrafts).toHaveBeenNthCalledWith(1, 'visibilitychange');
    expect(flushDrafts).toHaveBeenNthCalledWith(2, 'pagehide');

    unregister();
    removeVisibilityHandlers();
  });
});
