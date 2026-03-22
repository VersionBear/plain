# Plain

Plain is a calm local-first notes app built with React, Vite, Tailwind CSS, and Zustand.

It focuses on fast writing, rich text editing, and a clean mobile-friendly experience without accounts, sync setup, or extra clutter.

Hosted version: [plain.versionbear.com](https://plain.versionbear.com)

## Features

- Rich text editor with live formatting toolbar
- Local-first note storage in `localStorage`
- Pin, delete, search, and sort notes
- Light and dark theme support
- Dedicated mobile layout with an editor-first flow and slide-up notes sheet
- Responsive desktop layout with a notes sidebar and editor pane

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Zustand

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Project Notes

- Notes are stored on the current device only.
- Theme preference is stored locally.
- Rich text content is stored as HTML.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Credit

Made by [VersionBear](https://versionbear.com).
