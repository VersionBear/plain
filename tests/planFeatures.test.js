import { describe, expect, it } from 'vitest';
import {
  FOUNDERS_PACK_PRODUCT_ID,
  PLAIN_PRO_PRODUCT_ID,
} from '../src/utils/foundersPack';
import {
  getPlanTier,
  hasPlanAccess,
  PLAN_TIERS,
} from '../src/utils/planFeatures';

describe('plan feature helpers', () => {
  it('treats users without an active license as free', () => {
    expect(
      getPlanTier({
        hasEarlyAccess: false,
        productId: PLAIN_PRO_PRODUCT_ID,
      }),
    ).toBe(PLAN_TIERS.FREE);
  });

  it('detects Plain Pro licenses', () => {
    expect(
      getPlanTier({
        hasEarlyAccess: true,
        productId: PLAIN_PRO_PRODUCT_ID,
      }),
    ).toBe(PLAN_TIERS.PRO);
  });

  it('detects Founders Pack licenses', () => {
    expect(
      getPlanTier({
        hasEarlyAccess: true,
        productId: FOUNDERS_PACK_PRODUCT_ID,
      }),
    ).toBe(PLAN_TIERS.FOUNDER);
  });

  it('compares plan access consistently', () => {
    expect(hasPlanAccess(PLAN_TIERS.PRO, PLAN_TIERS.PRO)).toBe(true);
    expect(hasPlanAccess(PLAN_TIERS.PRO, PLAN_TIERS.FOUNDER)).toBe(false);
    expect(hasPlanAccess(PLAN_TIERS.FOUNDER, PLAN_TIERS.PRO)).toBe(true);
  });
});
