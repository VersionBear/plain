import { describe, expect, it } from 'vitest';
import { getDailyEmptyStateMessage } from '../src/utils/emptyStateContent';

describe('empty state content helpers', () => {
  it('returns a stable prompt or tip for a given day', () => {
    const first = getDailyEmptyStateMessage(new Date('2026-04-01T09:00:00Z'));
    const second = getDailyEmptyStateMessage(new Date('2026-04-01T18:00:00Z'));

    expect(second).toEqual(first);
  });

  it('returns both prompts and tips across different days', () => {
    const promptDay = getDailyEmptyStateMessage(new Date('2026-04-02T09:00:00Z'));
    const tipDay = getDailyEmptyStateMessage(new Date('2026-04-01T09:00:00Z'));

    expect(['prompt', 'tip']).toContain(promptDay.kind);
    expect(['prompt', 'tip']).toContain(tipDay.kind);
    expect(promptDay.kind).not.toBe(tipDay.kind);
  });
});
