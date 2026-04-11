import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const TITLE_HEADING_PATTERN = /^#(?!#)\s+(.+?)\s*(?:\n+|$)/i;
const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_EMBEDDED_IMAGE_PATTERN = /^data:image\//i;
const ASSET_PATH_PATTERN = /^\.\/?assets\//i;

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

turndownService.use(gfm);

turndownService.addRule('tiptapTaskItem', {
  filter(node) {
    return node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem';
  },
  replacement(content, node, options) {
    const isChecked = node.getAttribute('data-checked') === 'true';
    const checkString = isChecked ? '[x]' : '[ ]';
    
    content = content
      .replace(/^\n+/, '') 
      .replace(/\n+$/, '\n') 
      .replace(/\n/gm, '\n    '); 
      
    let prefix = options.bulletListMarker + ' ';
    const parent = node.parentNode;
    if (parent && parent.nodeName === 'OL') {
      const start = parent.getAttribute('start');
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '.  ';
    }
    
    return prefix + checkString + ' ' + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
  }
});

turndownService.addRule('tiptapTaskCheckbox', {
  filter(node) {
    return node.nodeName === 'LABEL' && node.parentNode && node.parentNode.getAttribute('data-type') === 'taskItem';
  },
  replacement() {
    return '';
  }
});

turndownService.addRule('plainImageFigure', {
  filter(node) {
    return (
      node.nodeName === 'FIGURE' &&
      node.getAttribute('data-type') === 'plain-image'
    );
  },
  replacement(content, node) {
    const img = node.querySelector('img');
    if (!img) return '';
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    return `\n\n![${alt}](${src})\n\n`;
  },
});

turndownService.addRule('dotDivider', {
  filter(node) {
    return node.nodeName === 'DIV' && node.getAttribute('data-type') === 'dot-divider';
  },
  replacement() {
    return '\n\n<div data-type="dot-divider" class="dot-divider"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>\n\n';
  }
});

turndownService.addRule('table-br', {
  filter: function (node) {
    return node.nodeName === 'BR' && node.closest('table') !== null;
  },
  replacement: function () {
    return '<br>';
  }
});

const markdownRenderer = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    list(token) {
      const isTaskList =
        !token.ordered && token.items.every((item) => item.task);
      const renderedItems = token.items
        .map((item) => this.listitem(item))
        .join('');

      if (isTaskList) {
        return `<ul data-type="taskList">\n${renderedItems}</ul>\n`;
      }

      const tagName = token.ordered ? 'ol' : 'ul';
      const startAttribute =
        token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';

      return `<${tagName}${startAttribute}>\n${renderedItems}</${tagName}>\n`;
    },
    listitem(item) {
      if (!item.task) {
        return `<li>${this.parser.parse(item.tokens)}</li>\n`;
      }

      const checkedAttribute = item.checked ? 'true' : 'false';
      const checkboxState = item.checked ? ' checked="checked"' : '';

      return (
        `<li data-type="taskItem" data-checked="${checkedAttribute}">` +
        `<label><input type="checkbox"${checkboxState}><span></span></label>` +
        `<div>${this.parser.parse(item.tokens)}</div>` +
        `</li>\n`
      );
    },
    checkbox() {
      return '';
    },
  },
});

function normalizeLineEndings(value = '') {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function isSafeEmbeddedImageSource(src = '') {
  const trimmed = src.trim();
  return SAFE_EMBEDDED_IMAGE_PATTERN.test(trimmed) || ASSET_PATH_PATTERN.test(trimmed);
}

export function stripUnsafeEmbeddedImages(html = '') {
  if (!html.trim() || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(
    `<body>${html}</body>`,
    'text/html',
  );
  const { body } = documentFragment;

  body.querySelectorAll('figure[data-type="plain-image"]').forEach((figure) => {
    const image = figure.querySelector('img');

    if (!isSafeEmbeddedImageSource(image?.getAttribute('src') || '')) {
      figure.remove();
    }
  });

  body.querySelectorAll('img').forEach((image) => {
    if (!isSafeEmbeddedImageSource(image.getAttribute('src') || '')) {
      image.remove();
    }
  });

  return body.innerHTML;
}

export function sanitizeNoteHtml(html) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'data-type', 'data-width', 'data-align', 'style', 'class'],
  });

  return stripUnsafeEmbeddedImages(sanitizedHtml);
}

function parseFrontmatterValue(rawValue) {
  const value = rawValue.trim();

  if (!value) {
    return '';
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (value === 'null') {
    return null;
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (
    (value.startsWith('[') && value.endsWith(']')) ||
    (value.startsWith('{') && value.endsWith('}'))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  const numericValue = Number(value);

  if (!Number.isNaN(numericValue) && value === String(numericValue)) {
    return numericValue;
  }

  return value;
}

function parseFrontmatter(source = '') {
  const normalizedSource = normalizeLineEndings(source);
  const match = normalizedSource.match(
    /^---\n([\s\S]*?)\n---(?:\n+([\s\S]*))?$/,
  );

  if (!match) {
    return null;
  }

  const [, frontmatterBlock, body = ''] = match;
  const metadata = {};

  for (const line of frontmatterBlock.split('\n')) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1);

    if (!key) {
      continue;
    }

    metadata[key] = parseFrontmatterValue(rawValue);
  }

  return {
    metadata,
    body,
  };
}

function getFallbackTitleFromFileName(fileName = '') {
  const stem = fileName.replace(/\.[^.]+$/, '').trim();

  if (!stem || UUID_LIKE_PATTERN.test(stem)) {
    return '';
  }

  return stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTitleHeading(markdown) {
  const normalizedMarkdown = normalizeLineEndings(markdown).replace(/^\n+/, '');
  const match = normalizedMarkdown.match(TITLE_HEADING_PATTERN);

  if (!match) {
    return {
      title: '',
      body: normalizedMarkdown,
    };
  }

  const [, title] = match;
  const body = normalizedMarkdown.slice(match[0].length).replace(/^\n+/, '');

  return {
    title: title.trim(),
    body,
  };
}

function looksLikeHtmlDocument(content) {
  const trimmedContent = content.trim();

  if (!trimmedContent.startsWith('<')) {
    return false;
  }

  return /<\/?[a-z][\w:-]*[\s\S]*>/i.test(trimmedContent);
}

function prepareHtmlForTurndown(html) {
  if (!html || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<body>${html}</body>`,
    'text/html'
  );
  
  doc.querySelectorAll('table colgroup').forEach(el => el.remove());
  
  doc.querySelectorAll('th, td').forEach(cell => {
    const paragraphs = Array.from(cell.querySelectorAll('p'));
    
    if (paragraphs.length > 0) {
      paragraphs.forEach((p, index) => {
        const frag = doc.createDocumentFragment();
        while (p.firstChild) frag.appendChild(p.firstChild);
        
        if (index < paragraphs.length - 1) {
          frag.appendChild(doc.createElement('br'));
        }
        
        p.parentNode.replaceChild(frag, p);
      });
    }
  });
  
  return doc.body.innerHTML;
}

export function htmlToMarkdown(content = '') {
  if (!content.trim()) {
    return '';
  }

  const cleanedContent = prepareHtmlForTurndown(content);
  return normalizeLineEndings(turndownService.turndown(cleanedContent).trim());
}

export function markdownToHtml(content = '') {
  const normalizedContent = normalizeLineEndings(content).trim();

  if (!normalizedContent) {
    return '';
  }

  try {
    const renderedHtml = markdownRenderer.parse(normalizedContent);
    return sanitizeNoteHtml(renderedHtml).trim();
  } catch {
    return sanitizeNoteHtml(`<p>${normalizedContent}</p>`).trim();
  }
}

export function serializeNoteToMarkdown(note) {
  const title = normalizeLineEndings(note.title || '')
    .replace(/\s+/g, ' ')
    .trim();
  const bodyMarkdown = htmlToMarkdown(note.content || '');
  const sections = [];

  if (title) {
    sections.push(`# ${title}`);
  }

  if (bodyMarkdown) {
    sections.push(bodyMarkdown);
  }

  return `${sections.join('\n\n').trimEnd()}\n`;
}

export function parseMarkdownToNote(markdown, options = {}) {
  const normalizedMarkdown = normalizeLineEndings(markdown);
  const parsedFrontmatter = parseFrontmatter(normalizedMarkdown);
  const metadata = parsedFrontmatter?.metadata ?? {};
  const rawBody = parsedFrontmatter?.body ?? normalizedMarkdown;
  const { title: extractedTitle, body: markdownBody } = looksLikeHtmlDocument(
    rawBody,
  )
    ? {
        title: '',
        body: rawBody.trim(),
      }
    : extractTitleHeading(rawBody);
  const fallbackTimestamp =
    typeof options.lastModified === 'number' &&
    Number.isFinite(options.lastModified)
      ? options.lastModified
      : Date.now();
  const fallbackId = options.fileName
    ? options.fileName.replace(/\.[^.]+$/, '')
    : '';
  const resolvedTitle =
    extractedTitle ||
    (typeof metadata.title === 'string' && metadata.title.trim()
      ? metadata.title.trim()
      : '') ||
    getFallbackTitleFromFileName(options.fileName);
  const content = looksLikeHtmlDocument(rawBody)
    ? sanitizeNoteHtml(rawBody).trim()
    : markdownToHtml(markdownBody);

  return {
    id:
      typeof metadata.id === 'string' && metadata.id.trim()
        ? metadata.id.trim()
        : fallbackId,
    title: resolvedTitle,
    content,
    tags: metadata.tags,
    pinned: Boolean(metadata.pinned),
    createdAt:
      typeof metadata.createdAt === 'number' &&
      Number.isFinite(metadata.createdAt)
        ? metadata.createdAt
        : fallbackTimestamp,
    updatedAt:
      typeof metadata.updatedAt === 'number' &&
      Number.isFinite(metadata.updatedAt)
        ? metadata.updatedAt
        : fallbackTimestamp,
    trashedAt:
      typeof metadata.trashedAt === 'number' &&
      Number.isFinite(metadata.trashedAt)
        ? metadata.trashedAt
        : null,
  };
}
