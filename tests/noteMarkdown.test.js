import { describe, expect, it } from 'vitest';
import {
  isSafeEmbeddedImageSource,
  parseMarkdownToNote,
  serializeNoteToMarkdown,
} from '../src/utils/noteMarkdown';

describe('note markdown parsing', () => {
  it('does not throw on malformed frontmatter JSON', () => {
    const note = parseMarkdownToNote(
      [
        '---',
        'tags: [bad json',
        'pinned: true',
        '---',
        '# Title',
        '',
        'Body',
      ].join('\n'),
      {
        fileName: 'broken.md',
        lastModified: 1,
      },
    );

    expect(note.id).toBe('broken');
    expect(note.title).toBe('Title');
    expect(note.content).toContain('Body');
  });

  it('round-trips metadata-rich notes to markdown', () => {
    const markdown = serializeNoteToMarkdown({
      id: 'note-1',
      title: 'Hello',
      content: '<p>World</p>',
      tags: ['alpha'],
      pinned: true,
      createdAt: 10,
      updatedAt: 20,
      trashedAt: null,
    });

    expect(markdown).toContain('id: "note-1"');
    expect(markdown).toContain('# Hello');
  });

  it('drops remote images while keeping embedded data images', () => {
    const note = parseMarkdownToNote(
      [
        '# Title',
        '',
        '![remote](https://example.com/tracker.png)',
        '![embedded](data:image/png;base64,abc123)',
      ].join('\n'),
      {
        fileName: 'images.md',
        lastModified: 1,
      },
    );

    expect(note.content).not.toContain('https://example.com/tracker.png');
    expect(note.content).toContain('data:image/png;base64,abc123');
    expect(isSafeEmbeddedImageSource('data:image/png;base64,abc123')).toBe(
      true,
    );
    expect(isSafeEmbeddedImageSource('https://example.com/tracker.png')).toBe(
      false,
    );
  });
});
