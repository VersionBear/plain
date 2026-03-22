/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        pin: 'rgb(var(--color-pin) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        chrome: 'rgb(var(--color-chrome) / <alpha-value>)',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(28, 25, 23, 0.04)',
        selected: '0 0 0 1px rgba(111, 102, 91, 0.08), 0 10px 30px rgba(28, 25, 23, 0.06)',
      },
      fontFamily: {
        sans: ['Aptos', '"Segoe UI"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        calm: '-0.02em',
      },
    },
  },
  plugins: [],
};
