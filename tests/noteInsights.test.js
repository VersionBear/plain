import { describe, expect, it } from 'vitest';
import { getNoteInsights } from '../src/utils/noteInsights';

describe('note insights helpers', () => {
  it('counts words, characters, reading time, and headings', () => {
    const insights = getNoteInsights({
      title: 'Launch plan',
      content:
        '<h1>Overview</h1><p>Hello team this is a longer note.</p><h2>Next steps</h2><p>Ship soon.</p>',
    });

    expect(insights.wordCount).toBe(14);
    expect(insights.characterCount).toBe(76);
    expect(insights.readingTimeMinutes).toBe(1);
    expect(insights.headingCount).toBe(2);
    expect(insights.headings).toEqual([
      { level: 1, text: 'Overview' },
      { level: 2, text: 'Next steps' },
    ]);
  });

  it('returns zeroed insights for empty notes', () => {
    expect(getNoteInsights({ title: '', content: '' })).toEqual({
      wordCount: 0,
      characterCount: 0,
      readingTimeMinutes: 0,
      headings: [],
      headingCount: 0,
    });
  });
});
