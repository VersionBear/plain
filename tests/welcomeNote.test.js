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
    expect(note.content).toContain('Local-first, by default');
    expect(note.content).toContain('data-type="taskList"');
    expect(note.content).toContain('<table>');
  });

  it('seeds only when the library is truly empty', () => {
    expect(
      shouldSeedWelcomeNote({
        notes: [],
        trashedNotes: [],
      }),
    ).toBe(true);

    expect(
      shouldSeedWelcomeNote({
        notes: [{ id: 'existing-note' }],
        trashedNotes: [],
      }),
    ).toBe(false);

    expect(
      shouldSeedWelcomeNote(
        {
          notes: [],
          trashedNotes: [],
        },
        {
          notes: [{ id: 'legacy-note' }],
          trashedNotes: [],
        },
      ),
    ).toBe(false);
  });
});
