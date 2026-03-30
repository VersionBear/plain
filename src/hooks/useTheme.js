import { useEffect, useState } from 'react';

const storageKey = 'plain-theme';

function isThemeValue(value) {
  return value === 'light' || value === 'dark';
}

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(storageKey);
  return isThemeValue(value) ? value : null;
}

function getSystemTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialTheme() {
  return readStoredTheme() || getSystemTheme();
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const isDark = theme === 'dark';
  const themeColor = isDark ? '#000000' : '#ffffff';

  root.classList.toggle('dark', isDark);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', themeColor);
  }

  if (!body) {
    return;
  }

  body.classList.toggle('dark', isDark);
  body.dataset.theme = theme;
  body.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [hasStoredPreference, setHasStoredPreference] = useState(() =>
    Boolean(readStoredTheme()),
  );

  useEffect(() => {
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
    toggleTheme: () => {
      setHasStoredPreference(true);
      setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    },
  };
}
