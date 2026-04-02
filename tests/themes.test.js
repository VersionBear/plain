import { describe, expect, it } from 'vitest';
import { PLAN_TIERS } from '../src/utils/planFeatures';
import {
  getThemeAccessLabel,
  getVisibleThemes,
  hasThemeAccess,
  isEasterThemeFreePromoActive,
  resolveThemeForPlan,
} from '../src/utils/themes';

describe('theme access helpers', () => {
  it('shows only free themes to free users', () => {
    expect(
      getVisibleThemes(PLAN_TIERS.FREE, new Date('2026-05-01T12:00:00'))
        .map(({ id }) => id),
    ).toEqual([
      'light',
      'dark',
      'paper',
      'evergreen',
    ]);
  });

  it('temporarily shows the easter theme to free users through April 30, 2026', () => {
    expect(
      getVisibleThemes(PLAN_TIERS.FREE, new Date('2026-03-31T12:00:00'))
        .map(({ id }) => id),
    ).not.toContain('easter-bloom');
    expect(
      getVisibleThemes(PLAN_TIERS.FREE, new Date('2026-04-30T12:00:00'))
        .map(({ id }) => id),
    ).toContain('easter-bloom');
    expect(
      hasThemeAccess(
        'easter-bloom',
        PLAN_TIERS.FREE,
        new Date('2026-04-30T12:00:00'),
      ),
    ).toBe(true);
    expect(
      hasThemeAccess(
        'easter-bloom',
        PLAN_TIERS.FREE,
        new Date('2026-05-01T12:00:00'),
      ),
    ).toBe(false);
    expect(
      isEasterThemeFreePromoActive(new Date('2026-03-31T12:00:00')),
    ).toBe(false);
    expect(
      isEasterThemeFreePromoActive(new Date('2026-04-30T12:00:00')),
    ).toBe(true);
    expect(
      isEasterThemeFreePromoActive(new Date('2026-05-01T12:00:00')),
    ).toBe(false);
  });

  it('labels the easter theme as a temporary April free unlock for free users', () => {
    expect(
      getThemeAccessLabel(
        'easter-bloom',
        PLAN_TIERS.FREE,
        new Date('2026-04-15T12:00:00'),
      ),
    ).toBe('Free for April');
    expect(
      getThemeAccessLabel(
        'easter-bloom',
        PLAN_TIERS.PRO,
        new Date('2026-04-15T12:00:00'),
      ),
    ).toBe('Pro');
  });

  it('keeps premium themes visible for paid plans', () => {
    expect(getVisibleThemes(PLAN_TIERS.PRO).map(({ id }) => id)).toContain(
      'midnight',
    );
    expect(getVisibleThemes(PLAN_TIERS.PRO).map(({ id }) => id)).toContain(
      'ember',
    );
    expect(getVisibleThemes(PLAN_TIERS.PRO).map(({ id }) => id)).toContain(
      'easter-bloom',
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
    expect(hasThemeAccess('easter-bloom', PLAN_TIERS.PRO)).toBe(true);
    expect(hasThemeAccess('aurora-noir', PLAN_TIERS.PRO)).toBe(false);
    expect(hasThemeAccess('aurora-noir', PLAN_TIERS.FOUNDER)).toBe(true);
  });

  it('downgrades the easter theme to light for free users after the promo ends', () => {
    expect(
      resolveThemeForPlan(
        'easter-bloom',
        PLAN_TIERS.FREE,
        new Date('2026-05-01T12:00:00'),
      ),
    ).toBe('light');
  });
});
