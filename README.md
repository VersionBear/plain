# Plain

Plain is a local-first notes app built with React, Vite, Tailwind CSS, and Zustand.

The current app is centered around a custom rich text editor, quick note capture, and a calm two-pane layout that adapts into a mobile-friendly notes sheet on smaller screens. Notes stay on the current device only. There are no accounts, sync services, or backend dependencies.

## What It Does

- Creates and stores notes locally in the browser with Zustand persistence
- Uses a custom `contentEditable` rich text editor
- Supports headings, bold, italic, underline, strikethrough, blockquotes, bullet lists, numbered lists, links, checklist items, dividers, editable tables with expandable edges and optional headers, and inline images
- Lets you pin notes, delete notes, and search across note titles and note content
- Sorts pinned notes first, then sorts the rest by most recently updated
- Includes light and dark themes, with the initial theme following the system preference until a local preference is saved
- Works in a responsive split-pane desktop layout and a mobile editor-first layout with a slide-up notes library

## Storage Model

- Notes are stored in `localStorage` under the key `plain-notes`
- Theme preference is stored in `localStorage` under the key `plain-theme`
- Note bodies are saved as HTML, not Markdown
- Inserted images are stored as data URLs inside note content, so large images will increase local browser storage usage

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Zustand 5

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Start the local dev server:

```bash
npm run dev
```

3. Build the production bundle:

```bash
npm run build
```

4. Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
  components/      UI for the sidebar, note list, editor pane, and editor controls
  hooks/           Shared hooks such as theme persistence
  store/           Zustand note store and persisted app state
  utils/           Note helpers, date formatting, and an unused markdown renderer utility
```

## Current Behavior Notes

- If no note is selected, the app auto-selects the next available note
- Search is live and checks both the note title and plain-text content extracted from saved HTML
- The editor debounces content persistence during typing and flushes changes on blur/unmount
- Clicking an inserted image exposes width presets for resizing it in the editor
- Clicking an inserted table exposes compact desktop controls plus mobile-friendly controls for expanding or trimming any side and toggling top-row or left-column headers
- Links can be inserted or edited from the toolbar, and `Ctrl`/`Cmd` click opens them in a new tab

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Credit

Made by [VersionBear](https://versionbear.com).
