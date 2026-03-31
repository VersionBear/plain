import { hasPlanAccess, PLAN_TIERS } from './planFeatures';

export const THEME_OPTIONS = [
  { id: 'light', label: 'Light', preview: ['#ffffff', '#f5f5f5', '#0070f3'] },
  { id: 'dark', label: 'Dark', preview: ['#000000', '#141414', '#3291ff'] },
  {
    id: 'paper',
    label: 'Paper',
    preview: ['#faf6ef', '#f4eee6', '#b46b3f'],
  },
  {
    id: 'evergreen',
    label: 'Evergreen',
    preview: ['#0e1d18', '#152721', '#6ec999'],
  },
  {
    id: 'nord',
    label: 'Nord',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#2e3440', '#4c566a', '#88c0d0'],
  },
  {
    id: 'solarized',
    label: 'Solarized',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#fdf6e3', '#eee8d5', '#268bd2'],
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#000000', '#ffffff', '#ffff00'],
  },
  {
    id: 'graphite',
    label: 'Graphite',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#18181b', '#27272a', '#f472b6'],
  },
  {
    id: 'oceanic',
    label: 'Oceanic',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#091826', '#12314b', '#5dc9ff'],
  },
  {
    id: 'ember',
    label: 'Ember',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#1c100c', '#2d1b15', '#ff8f66'],
  },
  {
    id: 'linen-blue',
    label: 'Linen Blue',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#f1f5fa', '#e8eef6', '#4c76cc'],
  },
  {
    id: 'rose-paper',
    label: 'Rose Paper',
    minPlan: PLAN_TIERS.FOUNDER,
    preview: ['#fff8f4', '#fdf1ed', '#cd5e78'],
  },
  {
    id: 'midnight',
    label: 'Midnight',
    minPlan: PLAN_TIERS.FOUNDER,
    preview: ['#0c0d18', '#1e1f2e', '#fbbf24'],
  },
  {
    id: 'aurora-noir',
    label: 'Aurora Noir',
    minPlan: PLAN_TIERS.FOUNDER,
    preview: ['#0a0b14', '#191c2e', '#7effd0'],
  },
  {
    id: 'porcelain-ink',
    label: 'Porcelain Ink',
    minPlan: PLAN_TIERS.FOUNDER,
    preview: ['#f8f6f2', '#f1ede7', '#5c46c9'],
  },
];

const themeOptionsById = new Map(
  THEME_OPTIONS.map((themeOption) => [themeOption.id, themeOption]),
);

const darkThemeIds = new Set([
  'dark',
  'evergreen',
  'nord',
  'high-contrast',
  'graphite',
  'oceanic',
  'ember',
  'midnight',
  'aurora-noir',
]);

export const THEME_VALUES = THEME_OPTIONS.map((themeOption) => themeOption.id);
export const THEME_CLASSES = THEME_VALUES.filter((value) => value !== 'light');

export function isThemeValue(value) {
  return themeOptionsById.has(value);
}

export function getThemeOption(themeId) {
  return themeOptionsById.get(themeId) || null;
}

export function isDarkTheme(themeId) {
  return darkThemeIds.has(themeId);
}

export function hasThemeAccess(themeId, planTier = PLAN_TIERS.FREE) {
  const themeOption = themeOptionsById.get(themeId);

  if (!themeOption) {
    return false;
  }

  return !themeOption.minPlan || hasPlanAccess(planTier, themeOption.minPlan);
}

export function getVisibleThemes(planTier = PLAN_TIERS.FREE) {
  if (planTier === PLAN_TIERS.FREE) {
    return THEME_OPTIONS.filter((themeOption) => !themeOption.minPlan);
  }

  return THEME_OPTIONS;
}

export function resolveThemeForPlan(themeId, planTier = PLAN_TIERS.FREE) {
  if (!isThemeValue(themeId)) {
    return null;
  }

  if (hasThemeAccess(themeId, planTier)) {
    return themeId;
  }

  return isDarkTheme(themeId) ? 'dark' : 'light';
}
