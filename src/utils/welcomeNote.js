import { markdownToHtml } from './noteMarkdown';
import { makeEmptyNote } from './notes';

const welcomeNoteMarkdown = `
## Your thoughts start here

Plain is a minimalist, local-first workspace designed for speed and absolute privacy. There are no accounts to create, no servers to trust, and no complex sync to manage. Everything you write is saved instantly to your device.

<div data-type="dot-divider" class="dot-divider"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>

### 1. Own your data
By default, notes stay in your browser. For a truly professional setup, go to **Settings** and connect a folder on your disk. This saves your notes as standard Markdown files that you can open in any other app.

### 2. High-end editing
- Use standard Markdown shortcuts like \`#\`, \`-\`, or \`1.\` as you type.
- Press \`/\` at the start of any line to open the **Command Menu**.
- Drag and drop images directly into your notes.

### 3. First steps
- [x] Read this welcome note
- [ ] Create a new note (\`Alt + N\`)
- [ ] Explore the [**Documentation**](https://docs.plain.versionbear.com)
- [ ] Connect a folder for backup peace of mind

<div data-type="dot-divider" class="dot-divider"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>

> Plain keeps your thoughts close. You decide where they go.

\`\`\`text
Delete this note whenever you are ready.
Happy writing!
\`\`\`
`.trim();

const supportNoteMarkdown = `
## Support & Feedback

We're building Plain to be the best local-first note-taking tool on the web. Your feedback is essential to our journey.

<div data-type="dot-divider" class="dot-divider"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>

### Join the Community
Connect with the team and other users to share tips, report bugs, or suggest features.
- [**Join our Discord**](https://discord.gg/Zq28kBAPZ3)

### Leave a Review
If you're enjoying Plain, please consider leaving us a review. It helps others find the app and keeps us motivated.
- [**Write a review on Formshare**](https://formshare.ai/s/o9wz926YRe)

### Direct Support
Need help with something specific? Reach out to us on Discord, check our [**Official Documentation**](https://docs.plain.versionbear.com), or visit [**VersionBear.com**](https://versionbear.com) for more information.
`.trim();

const privacyNoteMarkdown = `
## Your Privacy is the Priority

In a world of data-harvesting, Plain takes a different path. Our privacy policy is simple: **we don't have your data.**

### Absolute Privacy
- **No Accounts**: You never sign in. We don't know who you are.
- **No Servers**: Your notes never touch our infrastructure.
- **No Tracking**: We don't use invasive analytics or cookies to follow you.

### Where your notes live
1. **Browser Storage**: By default, notes are stored in your browser's private database (IndexedDB).
2. **Local Folder**: If you connect a folder in Settings, notes are saved as raw files on your hard drive. 

### Third Parties
- **Formshare**: Used only if you explicitly choose to leave a review or suggest a theme.
- **Hosting**: The app is served via modern, secure CDN providers, but your *content* never leaves your device.

### Open Standards
Because Plain uses standard Markdown, you're never locked in. Your data is always yours to move, backup, or delete.
`.trim();

const guideNoteMarkdown = `
## Plain User Guide

Master the art of focused writing with this quick reference.

### The Foundations
- **Sidebar (Left)**: Your library. Toggle it with \`Cmd/Ctrl + \\\`.
- **Editor (Right)**: Your canvas. Everything auto-saves instantly.
- **Search**: Press \`Cmd/Ctrl + K\` to find any note or tag.

### Command Menu (\`/\`)
Type \`/\` on an empty line to insert sophisticated blocks:
- **Headings** (H1–H6)
- **Checklists** & Numbered Lists
- **Tables** for structured data
- **Quotes** & Code Blocks
- **Dividers** (Horizontal line or 3-dot)

### Global Keyboard Shortcuts
| Action | Windows / Linux | macOS |
| --- | --- | --- |
| **New Note** | \`Ctrl + N\` or \`Alt + N\` | \`Cmd + N\` |
| **Search** | \`Ctrl + K\` or \`Alt + K\` | \`Cmd + K\` |
| **Settings** | \`Ctrl + ,\` or \`Alt + ,\` | \`Cmd + ,\` |
| **Toggle Sidebar** | \`Ctrl + \\\` or \`Alt + \\\` | \`Cmd + \\\` |
| **Align Left** | \`Ctrl + Shift + L\` | \`Cmd + Shift + L\` |
| **Align Center** | \`Ctrl + Shift + E\` | \`Cmd + Shift + E\` |
| **Align Right** | \`Ctrl + Shift + R\` | \`Cmd + Shift + R\` |

> **Pro Tip**: If \`Ctrl + N\` opens a new browser window, use **\`Alt + N\`** instead. For a full list of commands, visit [**docs.plain.versionbear.com**](https://docs.plain.versionbear.com).

### Formatting Shortcuts
Plain supports standard Markdown as you type:
- \`#\` Heading 1
- \`##\` Heading 2
- \`- \` Bullet list
- \`1. \` Numbered list
- \`[] \` Task list
- \`**bold**\`, \`_italic_\`, \`~strike~\`

### Professional Storage
We highly recommend connecting a folder in **Settings**. This ensures your notes are stored as permanent files on your computer, making them easy to back up using tools like iCloud, Dropbox, or Git.
`.trim();

function createWelcomeNote() {
  return makeEmptyNote({
    title: 'Welcome to Plain',
    content: markdownToHtml(welcomeNoteMarkdown),
    tags: ['welcome'],
    pinned: true,
  });
}

function createPrivacyNote() {
  return makeEmptyNote({
    title: 'Privacy Policy',
    content: markdownToHtml(privacyNoteMarkdown),
    tags: ['privacy'],
    pinned: true,
  });
}

function createSupportNote() {
  return makeEmptyNote({
    title: 'Support & Community',
    content: markdownToHtml(supportNoteMarkdown),
    tags: ['support'],
    pinned: true,
  });
}

function createGuideNote() {
  return makeEmptyNote({
    title: 'User Guide',
    content: markdownToHtml(guideNoteMarkdown),
    tags: ['guide', 'tips'],
    pinned: true,
  });
}

/**
 * Creates the initial set of welcome notes for a new user.
 */
export function createWelcomeNotes() {
  return [
    createWelcomeNote(),
    createGuideNote(),
    createSupportNote(),
    createPrivacyNote(),
  ];
}

/**
 * Checks if the welcome notes should be seeded.
 */
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
