import { getPlainTextFromContent } from './notes';

const WORDS_PER_MINUTE = 220;

function normalizeWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function getNoteText(note = {}) {
  return normalizeWhitespace(
    [note?.title || '', getPlainTextFromContent(note?.content || '')]
      .filter(Boolean)
      .join(' '),
  );
}

function getHeadingText(content = '') {
  return normalizeWhitespace(getPlainTextFromContent(content));
}

export function getNoteHeadings(note = {}) {
  const content = note?.content || '';

  if (!content) {
    return [];
  }

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${content}</body>`, 'text/html');

    return Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: normalizeWhitespace(heading.textContent || ''),
      }))
      .filter(({ text }) => Boolean(text));
  }

  return [...content.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(([, level, headingContent]) => ({
      level: Number(level),
      text: getHeadingText(headingContent),
    }))
    .filter(({ text }) => Boolean(text));
}

export function getNoteInsights(note = {}) {
  const text = getNoteText(note);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const characterCount = text.length;
  const headings = getNoteHeadings(note);

  return {
    wordCount,
    characterCount,
    readingTimeMinutes:
      wordCount === 0
        ? 0
        : Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
    headings,
    headingCount: headings.length,
  };
}
