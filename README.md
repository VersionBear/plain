# Plain

Plain is a local-first notes app built with React, Vite, Tailwind CSS, Zustand, and Tiptap.

The current project is a responsive rich-text notes workspace with zero backend services. Notes stay on the device unless the user explicitly points the app at a local folder. There are no accounts, sync servers, or cloud APIs in this codebase.

## Current Product Scope

- Rich-text note editing with Tiptap
- Note title plus formatted body content
- Pinning, live search, trash, restore, and permanent delete
- Responsive desktop sidebar plus mobile slide-out library
- Light and dark themes with system-theme fallback
- Installable PWA shell with an auto-updating service worker
- Local storage adapters that prefer a real folder when the browser supports it

## Editor Capabilities

The active editor is `src/components/NoteEditor.jsx` and is powered by Tiptap, not `contentEditable` and not a Markdown source editor.

Supported editing features currently wired into the UI:

- Headings
- Bold, italic, and strikethrough
- Blockquotes
- Bullet lists, ordered lists, and task lists
- Text alignment for headings and paragraphs
- Links with add, edit, remove, and open-in-new-tab behavior
- Inline image upload from local files
- Tables with Tiptap table support
- Markdown-style input shortcuts handled by Tiptap extensions

Important storage detail:

- Notes are saved as HTML strings in the `content` field
- Images are embedded as base64 data URLs inside note content
- This is not a Markdown-first storage model

## Note Behavior

- New notes are created in the main `notes` collection
- Pinned notes sort above unpinned notes
- Normal notes sort by `updatedAt` descending
- Trashed notes sort by `trashedAt` descending
- Search checks both the title and a plain-text extraction of the saved HTML content
- Note content autosaves after a short debounce while typing
- Trashed notes become read-only until restored

Each note currently uses this shape:

```json
{
  "id": "uuid",
  "title": "",
  "content": "<p>Saved as HTML</p>",
  "pinned": false,
  "createdAt": 0,
  "updatedAt": 0,
  "trashedAt": null
}
```

## Storage Model

Plain now uses a storage adapter system in `src/storage/`.

Startup preference order:

1. Restore a previously approved folder connection if the browser still grants access
2. Fall back to browser-managed OPFS storage when available
3. Fall back to legacy `localStorage` storage when newer file APIs are unavailable

### Folder-backed storage

When the browser supports the File System Access API, users can choose a folder and Plain will store the library there.

Folder layout:

```text
<chosen-folder>/
  plain-index.json
  notes/
    <note-id>.json
  trash/
    <note-id>.json
```

Behavior details:

- The selected folder handle is remembered in IndexedDB
- If the chosen folder is empty, Plain copies the current in-browser library into it
- Trashing a note moves its JSON file from `notes/` to `trash/`
- Restoring a note moves it back to `notes/`
- Permanently deleting a note removes its file from `trash/`

### Browser-managed storage

If no folder is connected, Plain stores notes in browser-managed storage:

- Preferred modern path: OPFS under a `plain-data` directory
- Legacy compatibility path: `localStorage`

Legacy keys still recognized by the app:

- `plain-notes`
- `plain-library`
- `plain-legacy-import-complete`
- `plain-theme`

If older `plain-notes` data exists, the sidebar can surface an import action for those legacy notes.

## Browser Support

The app works best in browsers that support modern local file APIs.

- Folder sync requires `window.showDirectoryPicker`
- OPFS storage requires `navigator.storage.getDirectory`
- Remembering a chosen folder uses IndexedDB
- Theme persistence uses `localStorage`

If folder picking is unavailable, Plain still runs with browser-managed local storage.

## PWA Behavior

Plain is configured with `vite-plugin-pwa`.

- Service worker registration happens in `src/main.jsx`
- The manifest is defined in `vite.config.js`
- The service worker uses `registerType: 'autoUpdate'`
- Built assets are cached by Workbox
- There is no custom runtime API caching because the app has no backend

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Zustand 5
- Tiptap 3
- Lucide React
- `vite-plugin-pwa`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Current script coverage is intentionally small:

- `dev` starts Vite
- `build` creates the production bundle
- `preview` serves the production build locally

There is currently no lint script and no automated test script in `package.json`.

## Development Notes

- The main app shell lives in `src/App.jsx`
- State management lives in `src/store/useNotesStore.js`
- Storage adapters live in `src/storage/`
- The rich-text editor lives in `src/components/NoteEditor.jsx`
- Theme persistence lives in `src/hooks/useTheme.js`

Some repository dependencies and utilities are not part of the active UI flow right now, including the standalone markdown rendering utility in `src/utils/markdown.jsx`. The shipped note editor and saved note format are HTML/Tiptap-based.

## Project Structure

```text
src/
  components/   Sidebar, note list, editor pane, and rich-text editor UI
  hooks/        Shared hooks such as theme persistence
  storage/      Folder, OPFS, IndexedDB, and legacy localStorage adapters
  store/        Zustand app state and note actions
  utils/        Note sorting/filtering and date formatting helpers
public/         PWA icons and favicon assets
```

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Credit

Made by [VersionBear](https://versionbear.com).
