import DOMPurify from 'dompurify';
import {
  htmlToMarkdown,
  serializeNoteToMarkdown,
  stripUnsafeEmbeddedImages,
} from './noteMarkdown';
import { getExportFormats as getAvailableExportFormats } from './exportFormats';
import { getPlainTextFromContent } from './notes';

async function loadHtml2canvas() {
  const module = await import('html2canvas');
  return module.default;
}

async function loadJsPdf() {
  const module = await import('jspdf');
  return module.default;
}

/**
 * Export Configuration Types
 * @typedef {Object} ExportOptions
 * @property {number} [scale=2] - Scale factor for image exports (1-4)
 * @property {boolean} [darkMode=false] - Export with dark theme
 * @property {string} [format='png'] - Image format: 'png' | 'jpeg'
 * @property {number} [jpegQuality=0.95] - JPEG quality (0-1)
 * @property {boolean} [includeMetadata=true] - Include frontmatter in markdown
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} fileName - The filename for the download
 */
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename by replacing special characters
 * @param {string} title - The title to sanitize
 * @returns {string} - Sanitized filename
 */
export function getSafeExportName(title = 'untitled_note') {
  const safeTitle = String(title || 'untitled_note')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  return safeTitle || 'untitled_note';
}

function sanitizeExportHtml(content = '') {
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ADD_ATTR: [
      'target',
      'data-type',
      'data-width',
      'data-align',
      'style',
      'class',
    ],
  });

  return stripUnsafeEmbeddedImages(sanitizedHtml);
}

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create a temporary container for rendering export content
 * @param {string} content - HTML content
 * @param {string} title - Note title
 * @param {boolean} darkMode - Whether to use dark mode
 * @returns {HTMLElement} - The temporary container
 */
function createExportContainer(content, title, darkMode = false) {
  const sanitizedContent = sanitizeExportHtml(content);
  const container = document.createElement('div');
  container.className = 'plain-export-render-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-100000px';
  container.style.width = '1200px';
  container.style.maxWidth = '1200px';
  container.style.padding = '48px';
  container.style.boxSizing = 'border-box';
  container.style.background = darkMode ? '#0a0a0a' : '#ffffff';
  container.style.color = darkMode ? '#ededed' : '#111111';
  container.style.fontFamily = "'Inter', system-ui, sans-serif";
  container.style.fontSize = '16px';
  container.style.lineHeight = '1.6';
  container.setAttribute('aria-hidden', 'true');

  // Add title
  if (title) {
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.fontSize = '32px';
    titleEl.style.fontWeight = '700';
    titleEl.style.marginBottom = '24px';
    titleEl.style.color = darkMode ? '#ededed' : '#111111';
    container.appendChild(titleEl);
  }

  // Add content wrapper with prose styles
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'prose prose-slate max-w-none';
  contentWrapper.innerHTML = sanitizedContent;

  // Apply prose styles inline for export
  applyProseStyles(contentWrapper, darkMode);
  container.appendChild(contentWrapper);

  document.body.appendChild(container);
  return container;
}

/**
 * Apply prose-like styles to content for consistent export appearance
 * @param {HTMLElement} element - The element to style
 * @param {boolean} darkMode - Whether to use dark mode colors
 */
function applyProseStyles(element, darkMode = false) {
  const textColor = darkMode ? '#ededed' : '#374151';
  const headingColor = darkMode ? '#ffffff' : '#111827';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';
  const linkColor = darkMode ? '#60a5fa' : '#2563eb';

  // Paragraphs
  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach((p) => {
    p.style.color = textColor;
    p.style.marginBottom = '1.25em';
  });

  // Headings
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((h) => {
    h.style.color = headingColor;
    h.style.fontWeight = '600';
    h.style.marginTop = '1.5em';
    h.style.marginBottom = '0.75em';
  });

  // Links
  const links = element.querySelectorAll('a');
  links.forEach((a) => {
    a.style.color = linkColor;
    a.style.textDecoration = 'underline';
    a.style.textUnderlineOffset = '2px';
  });

  // Code blocks
  const preBlocks = element.querySelectorAll('pre');
  preBlocks.forEach((pre) => {
    pre.style.background = darkMode ? '#1f2937' : '#f3f4f6';
    pre.style.padding = '1em';
    pre.style.borderRadius = '0.5rem';
    pre.style.overflow = 'auto';
    pre.style.border = `1px solid ${borderColor}`;
  });

  const codeElements = element.querySelectorAll('code');
  codeElements.forEach((code) => {
    if (code.parentElement?.tagName !== 'PRE') {
      code.style.background = darkMode ? '#1f2937' : '#f3f4f6';
      code.style.padding = '0.2em 0.4em';
      code.style.borderRadius = '0.25rem';
      code.style.fontSize = '0.875em';
    }
  });

  // Blockquotes
  const blockquotes = element.querySelectorAll('blockquote');
  blockquotes.forEach((bq) => {
    bq.style.borderLeft = `4px solid ${darkMode ? '#4b5563' : '#9ca3af'}`;
    bq.style.paddingLeft = '1em';
    bq.style.color = darkMode ? '#9ca3af' : '#6b7280';
    bq.style.fontStyle = 'italic';
  });

  // Lists
  const lists = element.querySelectorAll('ul, ol');
  lists.forEach((list) => {
    list.style.marginBottom = '1.25em';
    list.style.paddingLeft = '1.625em';
  });

  const listItems = element.querySelectorAll('li');
  listItems.forEach((li) => {
    li.style.color = textColor;
    li.style.marginBottom = '0.5em';
  });

  // Tables
  const tables = element.querySelectorAll('table');
  tables.forEach((table) => {
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '1.25em';
  });

  const thElements = element.querySelectorAll('th');
  thElements.forEach((th) => {
    th.style.border = `1px solid ${borderColor}`;
    th.style.padding = '0.5em 0.75em';
    th.style.background = darkMode ? '#1f2937' : '#f9fafb';
    th.style.fontWeight = '600';
    th.style.textAlign = 'left';
  });

  const tdElements = element.querySelectorAll('td');
  tdElements.forEach((td) => {
    td.style.border = `1px solid ${borderColor}`;
    td.style.padding = '0.5em 0.75em';
    td.style.color = textColor;
  });

  // Images
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '0.5rem';
    img.style.border = `1px solid ${borderColor}`;
    img.style.margin = '0';
  });

  const figures = element.querySelectorAll('figure[data-type="plain-image"]');
  figures.forEach((figure) => {
    const align = figure.getAttribute('data-align') || 'center';
    const widthAttr = figure.getAttribute('data-width');
    const width = widthAttr !== null ? Number(widthAttr) : NaN;

    figure.style.width = `${Number.isFinite(width) ? Math.max(30, Math.min(100, width)) : 72}%`;
    figure.style.maxWidth = '100%';
    figure.style.marginTop = '1.5em';
    figure.style.marginBottom = '1.5em';
    figure.style.marginLeft = align === 'right' ? 'auto' : '0';
    figure.style.marginRight =
      align === 'left' ? 'auto' : align === 'center' ? 'auto' : '0';
  });

  const captions = element.querySelectorAll('figcaption');
  captions.forEach((caption) => {
    caption.style.marginTop = '0.75em';
    caption.style.fontSize = '0.92em';
    caption.style.lineHeight = '1.5';
    caption.style.color = darkMode ? '#9ca3af' : '#6b7280';
    caption.style.textAlign = 'center';
  });

  // Horizontal rules
  const hrs = element.querySelectorAll('hr');
  hrs.forEach((hr) => {
    hr.style.border = 'none';
    hr.style.borderTop = `1px solid ${borderColor}`;
    hr.style.margin = '2em 0';
  });

  // Task lists
  const taskLists = element.querySelectorAll('ul[data-type="taskList"]');
  taskLists.forEach((ul) => {
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
  });

  const taskItems = element.querySelectorAll('ul[data-type="taskList"] li');
  taskItems.forEach((li) => {
    li.style.display = 'flex';
    li.style.alignItems = 'flex-start';
    li.style.gap = '0.5em';
    li.style.marginBottom = '0.5em';
  });
}

/**
 * Remove temporary export container
 * @param {HTMLElement} container - The container to remove
 */
function removeExportContainer(container) {
  if (container && container.parentNode) {
    document.body.removeChild(container);
  }
}

/**
 * Wait for all images in a container to load
 * @param {HTMLElement} container
 */
async function waitForImagesToLoad(container) {
  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Resolve anyway to prevent hanging
    });
  });
  await Promise.all(promises);
  // Also wait for fonts to load
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

/**
 * Export note as Markdown file
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export function exportNoteAsMarkdown(note, options = {}) {
  const { includeMetadata = true } = options;
  const title = note.title || 'Untitled note';
  const markdownContent = htmlToMarkdown(note.content || '');
  const finalContent = includeMetadata
    ? serializeNoteToMarkdown(note)
    : `# ${title}\n\n${markdownContent}`.trimEnd() + '\n';

  const blob = new Blob([finalContent], {
    type: 'text/markdown;charset=utf-8',
  });
  downloadBlob(blob, `${getSafeExportName(title)}.md`);

  return Promise.resolve({ success: true, format: 'markdown' });
}

/**
 * Export note as Plain Text file
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export function exportNoteAsTxt(note, _options = {}) {
  const title = note.title || 'Untitled note';
  const textContent = getPlainTextFromContent(note.content || '').trim();
  const finalContent = `${title}\n\n${textContent}`;

  const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${getSafeExportName(title)}.txt`);

  return Promise.resolve({ success: true, format: 'text' });
}

/**
 * Export note as HTML file
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsHtml(note, options = {}) {
  const { darkMode = false } = options;
  const title = note.title || 'Untitled note';
  let content = sanitizeExportHtml(note.content || '');
  const escapedTitle = escapeHtml(title);

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${content}</body>`, 'text/html');
    const figures = doc.querySelectorAll('figure[data-type="plain-image"]');
    figures.forEach((fig) => {
      const widthAttr = fig.getAttribute('data-width');
      const width = widthAttr !== null ? Number(widthAttr) : NaN;
      if (Number.isFinite(width)) {
        fig.style.setProperty(
          '--plain-image-width',
          `${Math.max(30, Math.min(100, width))}%`,
        );
      }
    });
    content = doc.body.innerHTML;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    :root {
      --bg-color: ${darkMode ? '#0a0a0a' : '#ffffff'};
      --text-color: ${darkMode ? '#ededed' : '#111111'};
      --heading-color: ${darkMode ? '#ffffff' : '#111827'};
      --border-color: ${darkMode ? '#374151' : '#e5e7eb'};
      --link-color: ${darkMode ? '#60a5fa' : '#2563eb'};
      --code-bg: ${darkMode ? '#1f2937' : '#f3f4f6'};
      --blockquote-color: ${darkMode ? '#9ca3af' : '#6b7280'};
      --muted-color: ${darkMode ? '#9ca3af' : '#6b7280'};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      padding: 48px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--heading-color);
    }
    
    h2, h3, h4, h5, h6 {
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      color: var(--heading-color);
    }
    
    p {
      margin-bottom: 1.25em;
    }
    
    a {
      color: var(--link-color);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    
    pre {
      background: var(--code-bg);
      padding: 1em;
      border-radius: 0.5rem;
      overflow: auto;
      border: 1px solid var(--border-color);
      margin: 1.25em 0;
    }
    
    code {
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }
    
    pre code {
      background: transparent;
      padding: 0;
    }
    
    blockquote {
      border-left: 4px solid var(--border-color);
      padding-left: 1em;
      color: var(--blockquote-color);
      font-style: italic;
      margin: 1.25em 0;
    }
    
    ul, ol {
      margin-bottom: 1.25em;
      padding-left: 1.625em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.25em 0;
    }
    
    th, td {
      border: 1px solid var(--border-color);
      padding: 0.5em 0.75em;
      text-align: left;
    }
    
    th {
      background: var(--code-bg);
      font-weight: 600;
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
      margin: 0;
      display: block;
    }

    figure[data-type="plain-image"] {
      width: min(100%, var(--plain-image-width, 72%));
      margin: 1.5em auto;
    }

    figure[data-type="plain-image"][data-align="left"] {
      margin-left: 0;
      margin-right: auto;
    }

    figure[data-type="plain-image"][data-align="right"] {
      margin-left: auto;
      margin-right: 0;
    }

    figure[data-type="plain-image"] figcaption {
      margin-top: 0.75em;
      color: var(--muted-color);
      font-size: 0.92em;
      line-height: 1.5;
      text-align: center;
    }
    
    hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 2em 0;
    }
    
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
    }
    
    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
      margin-bottom: 0.5em;
    }
    
    @media print {
      body {
        padding: 0;
        max-width: none;
      }
    }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <div class="content">${content}</div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${getSafeExportName(title)}.html`);

  return { success: true, format: 'html' };
}

/**
 * Export note as PNG image
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsPng(note, options = {}) {
  const { scale = 2, darkMode = false } = options;
  const title = note.title || 'Untitled note';
  const content = note.content || '';
  const html2canvas = await loadHtml2canvas();

  const container = createExportContainer(content, title, darkMode);

  try {
    await waitForImagesToLoad(container);
    const width = Math.ceil(container.scrollWidth);
    const height = Math.ceil(container.scrollHeight);

    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: darkMode ? '#0a0a0a' : '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: width,
      windowHeight: height,
      width,
      height,
    });

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }

        downloadBlob(blob, `${getSafeExportName(title)}.png`);
        resolve({
          success: true,
          format: 'png',
          width: canvas.width,
          height: canvas.height,
        });
      }, 'image/png');
    });
  } finally {
    removeExportContainer(container);
  }
}

/**
 * Export note as JPEG image
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsJpeg(note, options = {}) {
  const { scale = 2, darkMode = false } = options;
  const jpegQuality = options.jpegQuality ?? options.quality ?? 0.95;
  const title = note.title || 'Untitled note';
  const content = note.content || '';
  const html2canvas = await loadHtml2canvas();

  const container = createExportContainer(content, title, darkMode);

  try {
    await waitForImagesToLoad(container);
    const width = Math.ceil(container.scrollWidth);
    const height = Math.ceil(container.scrollHeight);

    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: darkMode ? '#0a0a0a' : '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: width,
      windowHeight: height,
      width,
      height,
    });

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create JPEG blob'));
            return;
          }

          downloadBlob(blob, `${getSafeExportName(title)}.jpg`);
          resolve({
            success: true,
            format: 'jpeg',
            width: canvas.width,
            height: canvas.height,
          });
        },
        'image/jpeg',
        jpegQuality,
      );
    });
  } finally {
    removeExportContainer(container);
  }
}

/**
 * Export note as PDF using jsPDF
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsPdf(note, options = {}) {
  const { scale = 2, darkMode = false } = options;
  const pageFormat = options.pageFormat === 'letter' ? 'letter' : 'a4';
  const orientation =
    options.orientation === 'landscape' ? 'landscape' : 'portrait';
  const title = note.title || 'Untitled note';
  const content = note.content || '';
  const [html2canvas, jsPDF] = await Promise.all([
    loadHtml2canvas(),
    loadJsPdf(),
  ]);

  const container = createExportContainer(content, title, darkMode);

  try {
    await waitForImagesToLoad(container);
    const width = Math.ceil(container.scrollWidth);
    const height = Math.ceil(container.scrollHeight);

    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: darkMode ? '#0a0a0a' : '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: width,
      windowHeight: height,
      width,
      height,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageFormat,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Use width ratio to maintain readable text size, rather than squishing the whole note onto one page
    const ratio = pdfWidth / imgWidth;
    const totalPdfHeight = imgHeight * ratio;

    let heightLeft = totalPdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${getSafeExportName(title)}.pdf`);

    return {
      success: true,
      format: 'pdf',
      pages: pdf.internal.getNumberOfPages(),
    };
  } finally {
    removeExportContainer(container);
  }
}

/**
 * Export note as DOCX (stub for now, as real browser DOCX generation requires complex ZIP/XML packing)
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsDocx(note, _options = {}) {
  const title = note.title || 'Untitled note';

  // Fallback stub: In a full app, we would use something like the 'docx' package
  // For demonstration, we'll download a placeholder text file with the .docx extension
  const placeholderContent = `DOCX Generation coming soon!\n\nTitle: ${title}\n\nThis is a premium feature placeholder.`;
  const blob = new Blob([placeholderContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  downloadBlob(blob, `${getSafeExportName(title)}.docx`);

  return { success: true, format: 'docx' };
}

/**
 * Export note as ePub (stub for now, as real browser ePub generation requires complex ZIP/XML packing)
 * @param {Object} note - The note object
 * @param {ExportOptions} options - Export options
 */
export async function exportNoteAsEpub(note, _options = {}) {
  const title = note.title || 'Untitled note';

  // Fallback stub: In a full app, we would use something like jszip and epub-gen-memory
  // For demonstration, we'll download a placeholder text file with the .epub extension
  const placeholderContent = `EPUB Generation coming soon!\n\nTitle: ${title}\n\nThis is a premium feature placeholder.`;
  const blob = new Blob([placeholderContent], { type: 'application/epub+zip' });

  downloadBlob(blob, `${getSafeExportName(title)}.epub`);

  return { success: true, format: 'epub' };
}

/**
 * Export note with progress callback
 * @param {Object} note - The note object
 * @param {string} format - Export format: 'markdown' | 'text' | 'html' | 'png' | 'jpeg' | 'pdf'
 * @param {ExportOptions} options - Export options
 * @param {Function} onProgress - Progress callback
 */
export async function exportNoteWithProgress(
  note,
  format,
  options = {},
  onProgress = () => {},
) {
  if (!note) {
    throw new Error('Note is required for export');
  }

  onProgress({ stage: 'preparing', progress: 0 });

  try {
    let result;

    switch (format) {
      case 'markdown':
        onProgress({ stage: 'converting', progress: 30 });
        result = await exportNoteAsMarkdown(note, options);
        onProgress({ stage: 'downloading', progress: 80 });
        break;

      case 'text':
        onProgress({ stage: 'converting', progress: 30 });
        result = await exportNoteAsTxt(note, options);
        onProgress({ stage: 'downloading', progress: 80 });
        break;

      case 'html':
        onProgress({ stage: 'rendering', progress: 30 });
        result = await exportNoteAsHtml(note, options);
        onProgress({ stage: 'downloading', progress: 80 });
        break;

      case 'png':
        onProgress({ stage: 'rendering', progress: 20 });
        result = await exportNoteAsPng(note, options);
        onProgress({ stage: 'encoding', progress: 70 });
        break;

      case 'jpeg':
        onProgress({ stage: 'rendering', progress: 20 });
        result = await exportNoteAsJpeg(note, options);
        onProgress({ stage: 'encoding', progress: 70 });
        break;

      case 'pdf':
        onProgress({ stage: 'rendering', progress: 20 });
        result = await exportNoteAsPdf(note, options);
        onProgress({ stage: 'generating', progress: 70 });
        break;

      case 'docx':
        onProgress({ stage: 'rendering', progress: 30 });
        result = await exportNoteAsDocx(note, options);
        onProgress({ stage: 'generating', progress: 80 });
        break;

      case 'epub':
        onProgress({ stage: 'rendering', progress: 30 });
        result = await exportNoteAsEpub(note, options);
        onProgress({ stage: 'generating', progress: 80 });
        break;

      default:
        throw new Error(`Unknown export format: ${format}`);
    }

    onProgress({ stage: 'complete', progress: 100 });
    return result;
  } catch (error) {
    onProgress({ stage: 'error', progress: 0, error });
    throw error;
  }
}

/**
 * Get available export formats
 * @returns {Array<{id: string, label: string, description: string, extension: string}>}
 */
export function getExportFormats() {
  return getAvailableExportFormats();
}
