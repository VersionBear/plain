export function getPlainTextFromContent(content) {
  return content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<input[^>]*type=["']checkbox["'][^>]*checked[^>]*>/gi, '[x] ')
    .replace(/<input[^>]*type=["']checkbox["'][^>]*>/gi, '[ ] ')
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, ' $1 ')
    .replace(/<img[^>]*>/gi, ' [Image] ')
    .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<\/(figure|figcaption)>/gi, '\n')
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

export function normalizeTag(tag) {
  if (typeof tag !== 'string') {
    return '';
  }

  return tag.replace(/^#+/, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function extractTagsFromContent(content = '') {
  const text = getPlainTextFromContent(content);
  const tagMatches = text.match(/(?:^|\s)#([a-zA-Z0-9_-]+)/g);

  if (!tagMatches) {
    return [];
  }

  return [...new Set(tagMatches.map((tag) => normalizeTag(tag)))].sort(
    (left, right) => left.localeCompare(right),
  );
}

export function normalizeTags(tags = [], fallbackContent = '', options = {}) {
  const { allowContentFallback = false } = options;
  const rawTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  const normalizedTags = [
    ...new Set(rawTags.map((tag) => normalizeTag(tag)).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right));

  if (normalizedTags.length > 0 || !allowContentFallback) {
    return normalizedTags;
  }

  return extractTagsFromContent(fallbackContent);
}

export function getNoteTags(note = {}) {
  return normalizeTags(note?.tags, '', {
    allowContentFallback: false,
  });
}

export function noteHasTag(note, tag) {
  const normalizedTag = normalizeTag(tag);

  if (!normalizedTag) {
    return true;
  }

  return getNoteTags(note).includes(normalizedTag);
}

export function sortNotes(notes) {
  return [...notes].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.updatedAt - left.updatedAt;
  });
}

export function sortTrashedNotes(notes) {
  return [...notes].sort((left, right) => {
    const leftTimestamp =
      typeof left.trashedAt === 'number' ? left.trashedAt : left.updatedAt;
    const rightTimestamp =
      typeof right.trashedAt === 'number' ? right.trashedAt : right.updatedAt;

    return rightTimestamp - leftTimestamp;
  });
}

export function filterNotes(notes, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return notes;
  }

  return notes.filter((note) => {
    const tags = getNoteTags(note);
    const searchableContent = `${note.title} ${getPlainTextFromContent(note.content)} ${tags
      .map((tag) => `${tag} #${tag}`)
      .join(' ')}`;
    return searchableContent.toLowerCase().includes(normalizedQuery);
  });
}

export function filterNotesByTag(notes, tag) {
  const normalizedTag = normalizeTag(tag);

  if (!normalizedTag) {
    return notes;
  }

  return notes.filter((note) => noteHasTag(note, normalizedTag));
}

export function getTagSummary(notes) {
  const tagCounts = new Map();

  for (const note of notes) {
    for (const tag of getNoteTags(note)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return [...tagCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tag, count]) => ({
      tag,
      count,
    }));
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

export function extractTags(note) {
  return getNoteTags(note);
}

export function makeEmptyNote(overrides = {}) {
  const now = Date.now();
  const note = {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    tags: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
    trashedAt: null,
    ...overrides,
  };

  return {
    ...note,
    tags: normalizeTags(note.tags, '', { allowContentFallback: false }),
  };
}

export function getNextSelectedNoteId(notes, query = '', sortFn = sortNotes) {
  const sortedNotes = sortFn(notes);
  const filtered = filterNotes(sortedNotes, query);
  return filtered[0]?.id ?? sortedNotes[0]?.id ?? null;
}
