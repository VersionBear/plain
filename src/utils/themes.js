import { getPlanLabel, hasPlanAccess, PLAN_TIERS } from './planFeatures';

const EASTER_THEME_FREE_PROMO_START = {
  year: 2026,
  month: 3,
  day: 1,
};

const EASTER_THEME_FREE_PROMO_END = {
  year: 2026,
  month: 3,
  day: 30,
};

function compareLocalDateParts(date, targetDate) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (year !== targetDate.year) {
    return year - targetDate.year;
  }

  if (month !== targetDate.month) {
    return month - targetDate.month;
  }

  return day - targetDate.day;
}

function isWithinLocalDateRange(date, startDate, endDate) {
  return (
    compareLocalDateParts(date, startDate) >= 0 &&
    compareLocalDateParts(date, endDate) <= 0
  );
}

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
    id: 'easter-bloom',
    label: 'Easter Bloom',
    minPlan: PLAN_TIERS.PRO,
    preview: ['#fff8fb', '#f6efe5', '#f59eaf'],
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
  {
    id: 'versionbear',
    label: 'VersionBear',
    minPlan: PLAN_TIERS.FOUNDER,
    preview: ['#fff9f5', '#fdf6f1', '#f59e0b'],
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

export function isEasterThemeFreePromoActive(currentDate = new Date()) {
  return isWithinLocalDateRange(
    currentDate,
    EASTER_THEME_FREE_PROMO_START,
    EASTER_THEME_FREE_PROMO_END,
  );
}

export function getThemeAccessLabel(
  themeId,
  planTier = PLAN_TIERS.FREE,
  currentDate = new Date(),
) {
  const themeOption = themeOptionsById.get(themeId);

  if (!themeOption) {
    return '';
  }

  if (
    themeId === 'easter-bloom' &&
    planTier === PLAN_TIERS.FREE &&
    isEasterThemeFreePromoActive(currentDate)
  ) {
    return 'Free for April';
  }

  if (!themeOption.minPlan) {
    return 'Included';
  }

  return getPlanLabel(themeOption.minPlan);
}

export function hasThemeAccess(
  themeId,
  planTier = PLAN_TIERS.FREE,
  currentDate = new Date(),
) {
  const themeOption = themeOptionsById.get(themeId);

  if (!themeOption) {
    return false;
  }

  if (
    themeId === 'easter-bloom' &&
    planTier === PLAN_TIERS.FREE &&
    isEasterThemeFreePromoActive(currentDate)
  ) {
    return true;
  }

  return !themeOption.minPlan || hasPlanAccess(planTier, themeOption.minPlan);
}

export function getVisibleThemes(
  planTier = PLAN_TIERS.FREE,
  currentDate = new Date(),
) {
  if (planTier === PLAN_TIERS.FREE) {
    return THEME_OPTIONS.filter(
      (themeOption) =>
        !themeOption.minPlan ||
        hasThemeAccess(themeOption.id, planTier, currentDate),
    );
  }

  return THEME_OPTIONS;
}

export function resolveThemeForPlan(
  themeId,
  planTier = PLAN_TIERS.FREE,
  currentDate = new Date(),
) {
  if (!isThemeValue(themeId)) {
    return null;
  }

  if (hasThemeAccess(themeId, planTier, currentDate)) {
    return themeId;
  }

  return isDarkTheme(themeId) ? 'dark' : 'light';
}
