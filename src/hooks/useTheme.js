import { useEffect, useState } from 'react';
import { isDarkTheme, isThemeValue, THEME_CLASSES } from '../utils/themes';

const storageKey = 'plain-theme';

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(storageKey);
  return isThemeValue(value) ? value : null;
}

function getInitialTheme() {
  return readStoredTheme() || 'dark';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const isDark = isDarkTheme(theme);
  const themeColor = isDark ? '#000000' : '#ffffff';

  root.classList.remove(...THEME_CLASSES);

  if (theme !== 'light') {
    root.classList.add(theme);
  }

  root.dataset.theme = theme;
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', themeColor);
  }

  if (!body) {
    return;
  }

  body.classList.remove(...THEME_CLASSES);
  if (theme !== 'light') {
    body.classList.add(theme);
  }

  body.dataset.theme = theme;
  body.style.colorScheme = isDark ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [hasStoredPreference, setHasStoredPreference] = useState(() =>
    Boolean(readStoredTheme()),
  );

  useEffect(() => {
    if (!isThemeValue(theme)) {
      setTheme('light');
      return;
    }

    applyTheme(theme);

    if (hasStoredPreference) {
      localStorage.setItem(storageKey, theme);
      return;
    }

    localStorage.removeItem(storageKey);
  }, [hasStoredPreference, theme]);

  useEffect(() => {
    if (hasStoredPreference) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasStoredPreference]);

  return {
    theme,
    setTheme: (newTheme) => {
      if (!isThemeValue(newTheme)) {
        return;
      }

      setHasStoredPreference(true);
      setTheme(newTheme);
    },
    toggleTheme: () => {
      setHasStoredPreference(true);
      setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    },
  };
}
