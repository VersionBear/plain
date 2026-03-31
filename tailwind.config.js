/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

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
        selected:
          '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)',
        floating:
          '0 10px 40px -10px rgba(0,0,0,0.1), 0 4px 10px -5px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: [
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      letterSpacing: {
        calm: '-0.015em',
        tightest: '-0.025em',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'rgb(var(--color-ink))',
            lineHeight: '1.6',
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            a: {
              color: 'rgb(var(--color-accent))',
              '&:hover': {
                opacity: 0.8,
              },
            },
            'h1, h2, h3, h4': {
              color: 'rgb(var(--color-ink))',
              fontWeight: '600',
              letterSpacing: '-0.025em',
            },
            strong: {
              color: 'rgb(var(--color-ink))',
            },
            blockquote: {
              borderLeftColor: 'rgb(var(--color-accent))',
              color: 'rgb(var(--color-muted))',
            },
            hr: {
              borderColor: 'rgb(var(--color-line))',
            },
            'ul > li::marker': {
              color: 'rgb(var(--color-muted))',
            },
            'ol > li::marker': {
              color: 'rgb(var(--color-muted))',
            },
            pre: {
              backgroundColor: 'rgb(var(--color-panel))',
              color: 'rgb(var(--color-ink))',
            },
            code: {
              color: 'rgb(var(--color-ink))',
              backgroundColor: 'rgb(var(--color-panel))',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};
