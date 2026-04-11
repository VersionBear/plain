import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      // Enable fast refresh in production for better DX
      fastRefresh: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'app-icon.svg', 'app-icon-maskable.svg'],
      manifest: {
        name: 'Plain',
        short_name: 'Plain',
        description:
          'Plain is a local-first notes app with no accounts, no plugins, and no setup.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/app-icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
        runtimeCaching: [],
        // Optimize cache strategy
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  build: {
    // Improve build performance
    target: 'es2020',
    cssTarget: 'chrome89',
    // Better code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Tiptap core (excluding pm which has build issues)
          'tiptap-core': ['@tiptap/react', '@tiptap/core'],
          'tiptap-extensions': [
            '@tiptap/starter-kit',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-table',
            '@tiptap/extension-table-cell',
            '@tiptap/extension-table-header',
            '@tiptap/extension-table-row',
            '@tiptap/extension-task-item',
            '@tiptap/extension-task-list',
            '@tiptap/extension-text-align',
            '@tiptap/extension-typography',
            '@tiptap/extension-bubble-menu',
            '@tiptap/extension-floating-menu',
            '@tiptap/suggestion',
          ],
          // Split UI library
          'ui-kit': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          // Split utilities
          'markdown-utils': ['marked', 'turndown', 'turndown-plugin-gfm', 'dompurify'],
          // State management
          state: ['zustand'],
        },
      },
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Keep console for error reporting
        drop_console: false,
        // Remove debugger statements
        drop_debugger: true,
        // Optimize for modern browsers
        ecma: 2020,
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'use-sync-external-store/shim/index.js',
      'use-sync-external-store/shim/with-selector.js',
    ],
  },
});
