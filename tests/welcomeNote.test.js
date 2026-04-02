import { describe, expect, it } from 'vitest';
import {
  createWelcomeNote,
  shouldSeedWelcomeNote,
} from '../src/utils/welcomeNote';

describe('welcome note helpers', () => {
  it('builds a pinned starter note with rich editor content', () => {
    const note = createWelcomeNote();

    expect(note.title).toBe('Welcome to Plain');
    expect(note.pinned).toBe(true);
    expect(note.tags).toEqual(['editor-tips', 'local-first', 'welcome']);
    expect(note.content).toContain('Your notes start on this device');
    expect(note.content).toContain('data-type="taskList"');
    expect(note.content).toContain('<table>');
  });

  it('seeds only when the library is truly empty', () => {
    expect(
      shouldSeedWelcomeNote({
        index: { hasInitializedLibrary: false },
        notes: [],
        trashedNotes: [],
      }),
    ).toBe(true);

    expect(
      shouldSeedWelcomeNote({
        index: { hasInitializedLibrary: false },
        notes: [{ id: 'existing-note' }],
        trashedNotes: [],
      }),
    ).toBe(false);

    expect(
      shouldSeedWelcomeNote(
        {
          index: { hasInitializedLibrary: false },
          notes: [],
          trashedNotes: [],
        },
        {
          notes: [{ id: 'legacy-note' }],
          trashedNotes: [],
        },
      ),
    ).toBe(false);

    expect(
      shouldSeedWelcomeNote({
        index: { hasInitializedLibrary: true },
        notes: [],
        trashedNotes: [],
      }),
    ).toBe(false);
  });
});
