import { PLAN_TIERS, getPlanLabel } from './planFeatures';

export const PRO_PLAN_FEATURES = [
  'Premium themes and palettes',
  'Writing insights with word count, characters, and read time',
  'Starter templates for daily notes, meetings, projects, reading, and weekly reviews',
  'Layout controls for wider writing and focused reading',
  'Premium workspace upgrades across themes, templates, and note insights',
];

export const FOUNDER_PLAN_FEATURES = [
  'Everything in Pro',
  'Interactive outline panel for long notes',
  'Founder-only Rose Paper, Midnight, Aurora Noir, Porcelain Ink, and VersionBear themes',
];

export function getPlanFeatureList(planTier = PLAN_TIERS.FREE) {
  if (planTier === PLAN_TIERS.FOUNDER) {
    return FOUNDER_PLAN_FEATURES;
  }

  if (planTier === PLAN_TIERS.PRO) {
    return PRO_PLAN_FEATURES;
  }

  return [];
}

export function getPlanFeatureBadgeLabel(planTier = PLAN_TIERS.FREE) {
  if (planTier === PLAN_TIERS.FOUNDER) {
    return 'Included';
  }

  if (planTier === PLAN_TIERS.PRO) {
    return 'Active';
  }

  return 'Upgrade';
}

export function getPaidExtrasDescription(planTier = PLAN_TIERS.FREE) {
  if (planTier === PLAN_TIERS.FOUNDER) {
    return 'Founder includes every Pro feature, plus the outline panel and founder-only themes.';
  }

  if (planTier === PLAN_TIERS.PRO) {
    return 'Pro unlocks premium themes, note insights, starter templates, and extra workspace polish. Founder adds the outline panel and founder-only themes.';
  }

  return 'Upgrade to Pro for premium themes, note insights, starter templates, and extra workspace polish. Founder adds the outline panel and founder-only themes.';
}

export function getPlanRequirementCopy(requiredPlan = PLAN_TIERS.PRO) {
  return `${getPlanLabel(requiredPlan)} feature`;
}
