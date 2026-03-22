export function getPlainTextFromContent(content) {
  return content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r\n/g, '\n');
}

export function sortNotes(notes) {
  return [...notes].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.updatedAt - left.updatedAt;
  });
}

export function filterNotes(notes, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return notes;
  }

  return notes.filter((note) => {
    const searchableContent = `${note.title} ${getPlainTextFromContent(note.content)}`;
    return searchableContent.toLowerCase().includes(normalizedQuery);
  });
}

export function getNoteTitle(note) {
  const title = note.title.trim();

  if (title) {
    return title;
  }

  const firstLine = getPlainTextFromContent(note.content)
    .split('\n')
    .find((line) => line.trim());
  return firstLine ? firstLine.trim().slice(0, 48) : 'Untitled note';
}

export function getNotePreview(note) {
  const previewSource =
    getPlainTextFromContent(note.content).trim() ||
    'A clear space for whatever you need to write next.';
  return previewSource.replace(/\s+/g, ' ').slice(0, 110);
}

export function makeEmptyNote() {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getNextSelectedNoteId(notes, query = '') {
  const filtered = filterNotes(sortNotes(notes), query);
  return filtered[0]?.id ?? sortNotes(notes)[0]?.id ?? null;
}
