# Plain

Plain is a local-first notes app built with React, Vite, Tailwind CSS,
Zustand, and Tiptap.

In practice, that means notes start on your device. If you do nothing else,
they stay in this browser on this device. If your browser supports it, you can
connect a local folder and save Markdown files on disk. There are no accounts,
no built-in sync, and no server-side note storage in this repository.

## What Ships Today

- Rich-text note editing with Tiptap
- Note title plus formatted body content
- Pinning, live search, tag filtering, trash, restore, and permanent delete
- Responsive desktop sidebar plus mobile slide-out library
- Installable PWA shell with an auto-updating service worker
- Local storage adapters that prefer a real folder when the browser supports it
- Export to Markdown, TXT, HTML, PNG, JPEG, and paid PDF
- Paid tiers for Pro and Founder features

## Editor Features

The active editor lives in `src/components/NoteEditor.jsx` and is a Tiptap
editor, not a Markdown source editor.

Supported editing features currently wired into the UI:

- Headings
- Bold, italic, and strikethrough
- Blockquotes
- Bullet lists, ordered lists, and task lists
- Horizontal dividers
- Text alignment for headings and paragraphs
- Links with add, edit, remove, and open behavior
- Inline image upload from local files
- Tables
- Markdown-style input shortcuts handled by Tiptap extensions

Important storage detail:

- Notes are edited and stored in-memory as sanitized HTML strings in the
  `content` field
- Images are embedded as base64 data URLs inside note content
- Folder-backed storage converts notes to readable Markdown on disk

## Paid Plans

Plain currently has three plan tiers in code:

- Free
  - Core editor and local-first storage
  - Free themes
  - Free export formats except PDF
- Pro
  - Premium themes
  - Writing insights with word count, character count, and read time
  - Starter templates: Daily Note, Meeting Notes, Project Brief, Reading Notes,
    Weekly Review
  - Advanced PDF controls: page size, orientation, margins, title, page numbers
  - Advanced HTML export controls: title and page width
- Founder
  - Everything in Pro
  - Interactive outline panel for long notes
  - Founder-only themes, including Rose Paper, Midnight, Aurora Noir,
    Porcelain Ink, and VersionBear

## Note Model

Each note currently uses this shape:

```json
{
  "id": "uuid",
  "title": "",
  "content": "<p>Saved as HTML</p>",
  "tags": [],
  "pinned": false,
  "createdAt": 0,
  "updatedAt": 0,
  "trashedAt": null
}
```

Behavior details:

- New notes are created in the main `notes` collection
- New notes can start blank or from built-in starter templates
- Pinned notes sort above unpinned notes
- Normal notes sort by `updatedAt` descending
- Trashed notes sort by `trashedAt` descending
- Search checks both title and a plain-text extraction of saved HTML content
- Trashed notes become read-only until restored

## Storage Model

Plain uses a storage adapter system in `src/storage/`.

Startup preference order:

1. Restore a previously approved folder connection if the browser still grants
   access
2. Fall back to browser-managed OPFS storage when available
3. Fall back to legacy `localStorage` storage when newer file APIs are
   unavailable

### Folder-backed storage

When the browser supports the File System Access API, users can connect a
folder and Plain will store the library there.

Folder layout:

```text
<chosen-folder>/
  plain-index.json
  notes/
    <note-id>.md
  trash/
    <note-id>.md
```

Behavior details:

- The selected folder handle is remembered in IndexedDB
- If the chosen folder is empty, Plain copies the current in-browser library
  into it
- Notes are written as Markdown with lightweight frontmatter metadata
- The note title is stored as a top-level `# Heading`
- Older `.json` notes and earlier HTML-in-`.md` notes still load for backwards
  compatibility
- Trashing a note moves its Markdown file from `notes/` to `trash/`
- Restoring a note moves it back to `notes/`
- Permanently deleting a note removes its file from `trash/`

This is the clearest built-in path if you want files on disk that you can see,
copy, and back up yourself.

### Browser-managed storage

If no folder is connected, Plain stores notes in browser-managed local storage
on that device:

- Preferred modern path: OPFS under a `plain-data` directory
- Legacy compatibility path: `localStorage`

Legacy keys still recognized by the app:

- `plain-notes`
- `plain-library`
- `plain-legacy-import-complete`
- `plain-theme`

If older `plain-notes` data exists, the sidebar can surface an import action
for those legacy notes.

## Data Safety And Recovery

Plain is intentionally local-first:

- No account system
- No built-in sync
- No server-side note backup in this repository

That means:

- Browser-only storage stays in the current browser on the current device
- Browser-only storage is not a cross-device backup
- Connecting a folder is the clearest built-in way to keep real Markdown files
  on disk
- Export is the manual backup path when you are not using folder storage

Launch-hardening currently in the app:

- The active editor flushes pending title/body drafts before note switches,
  section changes, backgrounding, and unload events
- A small last-resort draft recovery cache helps recover the latest in-flight
  draft across abrupt reloads
- The crash screen explicitly points users back to reload, storage docs, and
  support

If you need recovery outside a single browser/device, connect a folder or
export backups regularly.

## Export

Export formats currently available:

- Markdown
- Plain Text
- HTML
- PNG
- JPEG
- PDF

Plan gating:

- PDF is paid
- Advanced PDF controls are paid
- Advanced HTML layout controls are paid

## Themes

Theme support currently includes:

- Free themes such as Light, Dark, Paper, and Evergreen
- Pro themes such as Nord, Solarized, High Contrast, Graphite, Oceanic, Ember,
  Linen Blue, and Easter Bloom
- Founder-only themes such as Rose Paper, Midnight, Aurora Noir, Porcelain
  Ink, and VersionBear

Theme access is plan-aware, and the Easter Bloom theme currently includes a
temporary free promo window through April 30, 2026.

## Licensing

Paid access is verified with Gumroad.

Current license behavior:

- The app verifies Pro and Founder licenses against Gumroad
- The full license key is stored locally on-device so the user can re-check
  access later without re-pasting it
- The UI shows a masked version of the key
- License verification metadata such as email, order number, and last verified
  time are also persisted locally

## Browser Support

The app works best in browsers that support modern local file APIs.

- Folder storage requires `window.showDirectoryPicker`
- OPFS storage requires `navigator.storage.getDirectory`
- Remembering a chosen folder uses IndexedDB
- Theme persistence and some recovery state use `localStorage`

Platform notes:

- Folder storage depends on browser support for the File System Access API
- iOS does not support folder storage in this app
- Mobile and PWA browser behavior can be less reliable for file-system
  features than desktop browsers
- If folder picking is unavailable, Plain still runs with browser-managed
  storage on that device

## PWA Behavior

Plain is configured with `vite-plugin-pwa`.

- Service worker registration happens in `src/main.jsx`
- The manifest is defined in `vite.config.js`
- The service worker uses `registerType: 'autoUpdate'`
- Built assets are cached by Workbox
- There is no custom runtime API caching because the app has no backend

## Performance

Current launch-readiness performance work in the repo:

- Export libraries remain lazy-loaded
- The create-note menu is lazy-loaded
- The heavy note editor path is code-split away from the initial app shell
- CI enforces a size budget for the main entry bundle with `npm run
check:bundle`

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Zustand 5
- Tiptap 3
- Lucide React
- `vite-plugin-pwa`
- Vitest
- Playwright

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
npm run test:watch
npm run test:e2e
npm run build
npm run check:bundle
npm run format
npm run format:check
npm run preview
```

Current script coverage:

- `dev` starts Vite
- `lint` runs ESLint
- `test` runs the Vitest unit suite
- `test:watch` runs Vitest in watch mode
- `test:e2e` runs the Playwright end-to-end suite
- `build` creates the production bundle
- `check:bundle` enforces a size budget for the main app shell bundle
- `format` runs Prettier across the repository
- `format:check` verifies Prettier formatting without writing changes
- `preview` serves the production build locally

## Development Notes

- The main app shell lives in `src/App.jsx`
- State management lives in `src/store/useNotesStore.js`
- Storage adapters live in `src/storage/`
- The rich-text editor lives in `src/components/NoteEditor.jsx`
- Theme persistence lives in `src/hooks/useTheme.js`

Some dependencies and utilities are not part of the active UI flow right now,
including the standalone Markdown rendering utility in `src/utils/markdown.jsx`.
The shipped note editor and saved note format are HTML/Tiptap-based.

## Project Structure

```text
src/
  components/   Sidebar, note list, editor pane, modals, and rich-text editor UI
  hooks/        Shared hooks such as theme persistence and overlay focus
  storage/      Folder, OPFS, IndexedDB, and legacy localStorage adapters
  store/        Zustand app state and note actions
  utils/        Themes, export, plans, storage helpers, notes, and date helpers
  extensions/   Custom editor extensions
public/         PWA icons and favicon assets
scripts/        Repo automation such as bundle budget checks
tests/          Vitest unit tests and Playwright end-to-end coverage
```

## Public Docs

- Privacy: [PRIVACY.md](./PRIVACY.md)
- Support: [SUPPORT.md](./SUPPORT.md)

## Release Smoke Checklist

- Create a note, type in the title and body, then reload immediately
- Switch notes immediately after typing and confirm the draft persists
- Open offline and confirm existing notes still load
- Connect a folder, reconnect it, and confirm the status copy is accurate
- Export HTML and PDF from a populated note
- Redeem a Gumroad license, reload the app, and use `Check again`

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Credit

Made by [VersionBear](https://versionbear.com).
