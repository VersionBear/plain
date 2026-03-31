import { markdownToHtml } from './noteMarkdown';
import { makeEmptyNote } from './notes';

const welcomeNoteMarkdown = `
## Local-first, by default

Plain keeps your notes on this device first. There is no account required, no mandatory cloud sync, and no hidden workspace to set up before you can write.

- Your note library opens from local storage right away.
- You can connect a folder later if you want real markdown files on disk.
- Export stays optional, so you stay in control of your own data.

## Try the editor

Use markdown shortcuts like \`#\`, \`##\`, \`-\`, or \`1.\` while you type, or just use the toolbar when you want a quicker visual flow.

- **Bold** important ideas
- _Italicize_ supporting details
- Add links like [plain text docs](https://example.com)
- Build structure with headings, lists, quotes, and tables

> Local-first means your notes belong to you before they belong anywhere else.

## Quick checklist

- [x] Opened Plain
- [ ] Create your next note
- [ ] Try a heading, a checklist, and a table
- [ ] Connect a folder if you want files on disk

## Tiny example table

| What | Why it matters |
| --- | --- |
| Local storage | Your notes open fast on this device |
| Folder connection | You can work with real files when you want to |
| Export tools | PDF, Markdown, text, and more are ready when you are |

## One more thing

\`\`\`
Your notes start here.
Delete this welcome note whenever you are ready.
\`\`\`
`.trim();

export function createWelcomeNote() {
  return makeEmptyNote({
    title: 'Welcome to Plain',
    content: markdownToHtml(welcomeNoteMarkdown),
    tags: ['welcome', 'local-first', 'editor-tips'],
    pinned: true,
  });
}

export function shouldSeedWelcomeNote(library, pendingLegacyImport = null) {
  const hasExistingNotes =
    (library?.notes?.length ?? 0) > 0 || (library?.trashedNotes?.length ?? 0) > 0;
  const hasPendingLegacyNotes =
    (pendingLegacyImport?.notes?.length ?? 0) > 0 ||
    (pendingLegacyImport?.trashedNotes?.length ?? 0) > 0;

  return !hasExistingNotes && !hasPendingLegacyNotes;
}
