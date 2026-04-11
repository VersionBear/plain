export const THEME_OPTIONS = [
  { id: 'light', label: 'Light', preview: ['#ffffff', '#f5f5f5', '#0070f3'] },
  { id: 'dark', label: 'Dark', preview: ['#000000', '#141414', '#3291ff'] },
  { id: 'terminal', label: 'Terminal_', preview: ['#0a0a0a', '#141414', '#39ff14'] },
  { id: 'graphite', label: 'Graphite', preview: ['#1c1c1e', '#27272a', '#a1a1aa'] },
  { id: 'coffee', label: 'Coffee', preview: ['#fdfaf6', '#f5ebd9', '#8b5a2b'] },
  { id: 'midnight', label: 'Midnight', preview: ['#0f172a', '#1e293b', '#38bdf8'] },
  { id: 'nord', label: 'Nord', preview: ['#2e3440', '#3b4252', '#88c0d0'] },
  { id: 'gruvbox', label: 'Gruvbox', preview: ['#282828', '#3c3836', '#d79921'] },
  { id: 'rosepine', label: 'Rosé Pine', preview: ['#191724', '#1f1d2e', '#ebbcba'] },
  { id: 'dracula', label: 'Dracula', preview: ['#282a36', '#44475a', '#ff79c6'] },
];

const themeOptionsById = new Map(
  THEME_OPTIONS.map((themeOption) => [themeOption.id, themeOption]),
);

const darkThemeIds = new Set([
  'dark',
  'terminal',
  'graphite',
  'midnight',
  'nord',
  'gruvbox',
  'rosepine',
  'dracula'
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

export function getVisibleThemes() {
  return THEME_OPTIONS;
}

export function resolveThemeForPlan(themeId) {
  if (!isThemeValue(themeId)) {
    return null;
  }

  return themeId;
}
