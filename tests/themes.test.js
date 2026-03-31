import { describe, expect, it } from 'vitest';
import { PLAN_TIERS } from '../src/utils/planFeatures';
import {
  getVisibleThemes,
  hasThemeAccess,
  resolveThemeForPlan,
} from '../src/utils/themes';

describe('theme access helpers', () => {
  it('shows only free themes to free users', () => {
    expect(getVisibleThemes(PLAN_TIERS.FREE).map(({ id }) => id)).toEqual([
      'light',
      'dark',
      'paper',
      'evergreen',
    ]);
  });

  it('keeps premium themes visible for paid plans', () => {
    expect(getVisibleThemes(PLAN_TIERS.PRO).map(({ id }) => id)).toContain(
      'midnight',
    );
    expect(getVisibleThemes(PLAN_TIERS.PRO).map(({ id }) => id)).toContain(
      'ember',
    );
    expect(getVisibleThemes(PLAN_TIERS.FOUNDER).map(({ id }) => id)).toContain(
      'porcelain-ink',
    );
  });

  it('downgrades inaccessible dark themes to dark', () => {
    expect(resolveThemeForPlan('midnight', PLAN_TIERS.FREE)).toBe('dark');
  });

  it('downgrades inaccessible light themes to light', () => {
    expect(resolveThemeForPlan('rose-paper', PLAN_TIERS.PRO)).toBe('light');
  });

  it('checks theme access against the active plan tier', () => {
    expect(hasThemeAccess('paper', PLAN_TIERS.FREE)).toBe(true);
    expect(hasThemeAccess('solarized', PLAN_TIERS.FREE)).toBe(false);
    expect(hasThemeAccess('solarized', PLAN_TIERS.PRO)).toBe(true);
    expect(hasThemeAccess('aurora-noir', PLAN_TIERS.PRO)).toBe(false);
    expect(hasThemeAccess('aurora-noir', PLAN_TIERS.FOUNDER)).toBe(true);
  });
});
