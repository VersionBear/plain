import { markdownToHtml } from './noteMarkdown';
import { makeEmptyNote } from './notes';

const welcomeNoteMarkdown = `
## Your notes start on this device

Plain opens fast because it saves here first. There is no account to create and no built-in sync to set up.

- Notes open from this browser on this device.
- If your browser supports it, you can connect a folder and save Markdown files on disk.

## What to trust, and what not to

- Browser-only storage is not a cross-device backup.
- A connected folder gives you files you can see and manage yourself.
- Plain can recover a recent in-progress draft after a sudden reload, but that is a safety net, not a backup plan.

## Try the editor

Use markdown shortcuts like \`#\`, \`##\`, \`-\`, or \`1.\` while you type, or just use the toolbar when you want a quicker visual flow.

- **Bold** important ideas
- _Italicize_ supporting details
- Add links like [plain text docs](https://example.com)
- Build structure with headings, lists, quotes, and tables

> Plain keeps your notes close. You decide when to make another copy.

## First steps

- [x] Opened Plain
- [ ] Create your first note
- [ ] Try a heading, a checklist, and a table
- [ ] Connect a folder if you want Markdown files on disk

## Storage at a glance

| What | Why it matters |
| --- | --- |
| Browser-only storage | Fast and private on this device |
| Folder connection | Markdown files on disk that you manage |

## One more thing

\`\`\`
Your notes are already saving.
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
  const hasInitializedLibrary = Boolean(library?.index?.hasInitializedLibrary);
  const hasExistingNotes =
    (library?.notes?.length ?? 0) > 0 ||
    (library?.trashedNotes?.length ?? 0) > 0;
  const hasPendingLegacyNotes =
    (pendingLegacyImport?.notes?.length ?? 0) > 0 ||
    (pendingLegacyImport?.trashedNotes?.length ?? 0) > 0;

  return !hasInitializedLibrary && !hasExistingNotes && !hasPendingLegacyNotes;
}
