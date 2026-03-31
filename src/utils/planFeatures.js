import { FOUNDERS_PACK_PRODUCT_ID } from './foundersPack';

export const PLAN_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  FOUNDER: 'founder',
};

const PLAN_RANK = {
  [PLAN_TIERS.FREE]: 0,
  [PLAN_TIERS.PRO]: 1,
  [PLAN_TIERS.FOUNDER]: 2,
};

export function getPlanTier({ hasEarlyAccess = false, productId = '' } = {}) {
  if (!hasEarlyAccess) {
    return PLAN_TIERS.FREE;
  }

  return productId === FOUNDERS_PACK_PRODUCT_ID
    ? PLAN_TIERS.FOUNDER
    : PLAN_TIERS.PRO;
}

export function hasPlanAccess(planTier, requiredTier = PLAN_TIERS.PRO) {
  return PLAN_RANK[planTier] >= PLAN_RANK[requiredTier];
}

export function getPlanLabel(planTier) {
  switch (planTier) {
    case PLAN_TIERS.FOUNDER:
      return 'Founder';
    case PLAN_TIERS.PRO:
      return 'Pro';
    default:
      return 'Free';
  }
}
