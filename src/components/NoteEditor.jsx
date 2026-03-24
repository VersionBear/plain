import { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { getPlainTextFromContent } from '../utils/notes';

const toolbarActions = [
  { id: 'paragraph', title: 'Paragraph', icon: 'paragraph', type: 'command', command: 'formatBlock', value: 'p' },
  { id: 'heading-1', title: 'Large heading', icon: 'heading1', type: 'command', command: 'formatBlock', value: 'h1' },
  { id: 'heading-2', title: 'Section heading', icon: 'heading2', type: 'command', command: 'formatBlock', value: 'h2' },
  { id: 'bold', title: 'Bold', icon: 'bold', type: 'command', command: 'bold' },
  { id: 'italic', title: 'Italic', icon: 'italic', type: 'command', command: 'italic' },
  { id: 'underline', title: 'Underline', icon: 'underline', type: 'command', command: 'underline' },
  { id: 'strike', title: 'Strikethrough', icon: 'strike', type: 'command', command: 'strikeThrough' },
  { id: 'quote', title: 'Blockquote', icon: 'quote', type: 'command', command: 'formatBlock', value: 'blockquote' },
  { id: 'bullets', title: 'Bullet list', icon: 'bulletList', type: 'command', command: 'insertUnorderedList' },
  { id: 'numbers', title: 'Numbered list', icon: 'numberedList', type: 'command', command: 'insertOrderedList' },
  { id: 'link', title: 'Insert link', icon: 'link', type: 'custom', action: 'link' },
  { id: 'task', title: 'Checklist item', icon: 'checklist', type: 'custom', action: 'checklist' },
  { id: 'divider', title: 'Divider', icon: 'divider', type: 'custom', action: 'divider' },
  { id: 'table', title: 'Insert table', icon: 'table', type: 'custom', action: 'table' },
  { id: 'image', title: 'Insert image', icon: 'image', type: 'custom', action: 'image' },
];

const imageSizeOptions = [
  { value: 35, title: 'Small image', icon: 'imageSizeSmall' },
  { value: 55, title: 'Medium image', icon: 'imageSizeMedium' },
  { value: 75, title: 'Large image', icon: 'imageSizeLarge' },
  { value: 100, title: 'Full width image', icon: 'imageSizeFull' },
];

const tableExpandActions = [
  { id: 'top', side: 'top', label: 'Add Top', icon: 'arrowUp', className: 'col-start-2' },
  { id: 'left', side: 'left', label: 'Add Left', icon: 'arrowLeft', className: 'row-start-2' },
  { id: 'right', side: 'right', label: 'Add Right', icon: 'arrowRight', className: 'row-start-2' },
  { id: 'bottom', side: 'bottom', label: 'Add Bottom', icon: 'arrowDown', className: 'col-start-2' },
];

const tableDeleteActions = [
  { id: 'top', side: 'top', label: 'Delete Top', icon: 'arrowUp', className: 'col-start-2' },
  { id: 'left', side: 'left', label: 'Delete Left', icon: 'arrowLeft', className: 'row-start-2' },
  { id: 'right', side: 'right', label: 'Delete Right', icon: 'arrowRight', className: 'row-start-2' },
  { id: 'bottom', side: 'bottom', label: 'Delete Bottom', icon: 'arrowDown', className: 'col-start-2' },
];

const tableHeaderActions = [
  { id: 'horizontal', direction: 'horizontal', label: 'Top Header', icon: 'headerRow' },
  { id: 'vertical', direction: 'vertical', label: 'Left Header', icon: 'headerColumn' },
];

const emptyToolbarState = {
  block: '',
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  link: false,
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(text) {
  return escapeHtml(text);
}

function looksLikeHtml(content) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function toEditorHtml(content) {
  if (!content.trim()) {
    return '';
  }

  if (looksLikeHtml(content)) {
    return content;
  }

  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function normalizeBlockValue(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .toLowerCase();
}

function getSelectionContainer() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const node = selection.anchorNode;

  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
}

function getRangeContainer(range) {
  if (!range) {
    return null;
  }

  const node = range.commonAncestorContainer;

  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
}

function getActiveBlock(editor) {
  const queriedBlock = normalizeBlockValue(document.queryCommandValue('formatBlock'));

  if (['p', 'h1', 'h2', 'blockquote'].includes(queriedBlock)) {
    return queriedBlock;
  }

  const container = getSelectionContainer();

  if (!(container instanceof Element) || !editor.contains(container)) {
    return '';
  }

  const block = container.closest('p, h1, h2, blockquote');

  return block?.tagName.toLowerCase() ?? '';
}

function isSelectionInsideEditor(editor) {
  const selection = window.getSelection();

  if (!selection) {
    return false;
  }

  return [selection.anchorNode, selection.focusNode].some(
    (node) => node && editor.contains(node),
  );
}

function getActiveLink(editor) {
  const container = getSelectionContainer();

  if (!(container instanceof Element) || !editor.contains(container)) {
    return null;
  }

  return container.closest('a');
}

function getLinkFromRange(range) {
  const container = getRangeContainer(range);

  if (!(container instanceof Element)) {
    return null;
  }

  return container.closest('a');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

function parseImageWidth(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    return 100;
  }

  const parsed = Number.parseInt(normalizedValue.replace('%', ''), 10);

  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.min(Math.max(parsed, 20), 100);
}

function getImageFigure(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('figure.editor-image-block');
}

function getTableCell(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('th, td');
}

function getTableWrap(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('.editor-table-wrap');
}

function focusElementStart(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getImageWidth(figure) {
  return parseImageWidth(figure?.dataset.imageWidth ?? figure?.style.getPropertyValue('--image-width'));
}

function setImageWidth(figure, width) {
  const normalizedWidth = parseImageWidth(width);
  figure.dataset.imageWidth = String(normalizedWidth);
  figure.style.setProperty('--image-width', `${normalizedWidth}%`);
}

function getTableBodyRows(table) {
  if (!(table instanceof HTMLTableElement)) {
    return [];
  }

  if (table.tBodies.length > 0) {
    return Array.from(table.tBodies[0].rows);
  }

  return Array.from(table.rows);
}

function hasTableHeaderRow(table) {
  return Boolean(table instanceof HTMLTableElement && table.tHead?.rows.length);
}

function hasTableHeaderColumn(table) {
  const bodyRows = getTableBodyRows(table);

  return bodyRows.length > 0 && bodyRows.every((row) => row.cells[0]?.tagName === 'TH');
}

function replaceTableCellTag(cell, nextTagName) {
  if (!(cell instanceof HTMLTableCellElement)) {
    return null;
  }

  const normalizedTagName = nextTagName.toLowerCase();

  if (cell.tagName.toLowerCase() === normalizedTagName) {
    return cell;
  }

  const nextCell = document.createElement(normalizedTagName);
  nextCell.innerHTML = cell.innerHTML;

  for (const attribute of cell.attributes) {
    if (attribute.name !== 'scope') {
      nextCell.setAttribute(attribute.name, attribute.value);
    }
  }

  cell.replaceWith(nextCell);
  return nextCell;
}

function applyTableHeaderColumn(table, enabled) {
  const bodyRows = getTableBodyRows(table);

  bodyRows.forEach((row, rowIndex) => {
    const firstCell = row.cells[0];

    if (!firstCell) {
      return;
    }

    const nextCell = replaceTableCellTag(firstCell, enabled ? 'th' : 'td');

    if (!nextCell) {
      return;
    }

    if (enabled) {
      nextCell.scope = 'row';

      if (!nextCell.textContent?.trim()) {
        nextCell.textContent = `Label ${rowIndex + 1}`;
      }
    } else {
      nextCell.removeAttribute('scope');
    }
  });
}

function setTableHeaderRow(table, enabled) {
  if (!(table instanceof HTMLTableElement)) {
    return null;
  }

  const headerColumnEnabled = hasTableHeaderColumn(table);

  if (enabled) {
    if (hasTableHeaderRow(table)) {
      return table.tHead?.rows[0]?.cells[0] ?? null;
    }

    const sourceRow = getTableBodyRows(table)[0];

    if (!sourceRow) {
      return null;
    }

    const thead = table.tHead ?? table.createTHead();
    thead.appendChild(sourceRow);

    Array.from(sourceRow.cells).forEach((cell, index) => {
      const nextCell = replaceTableCellTag(cell, 'th');

      if (!nextCell) {
        return;
      }

      nextCell.scope = 'col';

      if (!nextCell.textContent?.trim()) {
        nextCell.textContent = `Heading ${index + 1}`;
      }
    });

    applyTableHeaderColumn(table, headerColumnEnabled);
    return sourceRow.cells[0] ?? null;
  }

  const headerRow = table.tHead?.rows[0];

  if (!headerRow) {
    return null;
  }

  const tbody = table.tBodies[0] ?? table.createTBody();
  tbody.insertBefore(headerRow, tbody.firstChild);

  Array.from(headerRow.cells).forEach((cell, index) => {
    const shouldUseHeaderCell = headerColumnEnabled && index === 0;
    const nextCell = replaceTableCellTag(cell, shouldUseHeaderCell ? 'th' : 'td');

    if (!nextCell) {
      return;
    }

    if (shouldUseHeaderCell) {
      nextCell.scope = 'row';
    } else {
      nextCell.removeAttribute('scope');
    }
  });

  if (table.tHead && table.tHead.rows.length === 0) {
    table.deleteTHead();
  }

  return headerRow.cells[0] ?? null;
}

function buildEmptyTableCell(tagName, text) {
  const cell = document.createElement(tagName);
  cell.textContent = text;
  return cell;
}

function getTableColumnCount(table) {
  return table.rows[0]?.cells.length || 0;
}

function addTableRow(table, side) {
  if (!(table instanceof HTMLTableElement)) {
    return null;
  }

  const columnCount = getTableColumnCount(table);

  if (!columnCount) {
    return null;
  }

  const tbody = table.tBodies[0] ?? table.createTBody();
  const insertAtTop = side === 'top';
  const row = tbody.insertRow(insertAtTop ? 0 : -1);
  const headerColumnEnabled = hasTableHeaderColumn(table);
  const rowIndex = insertAtTop ? 1 : tbody.rows.length;

  for (let index = 0; index < columnCount; index += 1) {
    const useHeaderCell = headerColumnEnabled && index === 0;
    const cell = buildEmptyTableCell(useHeaderCell ? 'th' : 'td', useHeaderCell ? `Label ${rowIndex}` : 'Cell');

    if (useHeaderCell) {
      cell.scope = 'row';
    }

    row.appendChild(cell);
  }

  return row.cells[headerColumnEnabled ? 1 : 0] ?? row.cells[0] ?? null;
}

function addTableColumn(table, side) {
  if (!(table instanceof HTMLTableElement)) {
    return null;
  }

  const headerRowEnabled = hasTableHeaderRow(table);
  const headerColumnEnabled = hasTableHeaderColumn(table);
  const targetIndex = side === 'left' ? (headerColumnEnabled ? 1 : 0) : null;
  let focusCell = null;

  Array.from(table.rows).forEach((row, rowIndex) => {
    const isHeaderRow = headerRowEnabled && row.parentElement?.tagName === 'THEAD';
    const insertIndex = targetIndex == null ? row.cells.length : targetIndex;
    const useHeaderCell = isHeaderRow;
    const text = useHeaderCell ? `Heading ${insertIndex + 1}` : 'Cell';
    const cell = buildEmptyTableCell(useHeaderCell ? 'th' : 'td', text);

    if (useHeaderCell) {
      cell.scope = 'col';
    }

    if (insertIndex >= row.cells.length) {
      row.appendChild(cell);
    } else {
      row.insertBefore(cell, row.cells[insertIndex]);
    }

    if (!focusCell && rowIndex === (headerRowEnabled ? 1 : 0)) {
      focusCell = cell;
    }
  });

  if (headerColumnEnabled) {
    applyTableHeaderColumn(table, true);
  }

  return focusCell;
}

function removeTableRow(table, side) {
  if (!(table instanceof HTMLTableElement)) {
    return null;
  }

  const bodyRows = getTableBodyRows(table);

  if (bodyRows.length <= 1) {
    return null;
  }

  const targetRow = side === 'top' ? bodyRows[0] : bodyRows[bodyRows.length - 1];
  const focusRow = side === 'top' ? bodyRows[1] : bodyRows[bodyRows.length - 2];
  const headerColumnEnabled = hasTableHeaderColumn(table);

  targetRow.remove();

  return focusRow?.cells[headerColumnEnabled ? 1 : 0] ?? focusRow?.cells[0] ?? null;
}

function removeTableColumn(table, side) {
  if (!(table instanceof HTMLTableElement)) {
    return null;
  }

  const columnCount = getTableColumnCount(table);

  if (columnCount <= 1) {
    return null;
  }

  const headerColumnEnabled = hasTableHeaderColumn(table);
  const targetIndex = side === 'left' ? (headerColumnEnabled ? 1 : 0) : columnCount - 1;

  if (targetIndex < 0 || targetIndex >= columnCount) {
    return null;
  }

  Array.from(table.rows).forEach((row) => {
    row.cells[targetIndex]?.remove();
  });

  const nextColumnCount = getTableColumnCount(table);
  const focusIndex = headerColumnEnabled ? Math.min(1, nextColumnCount - 1) : Math.min(targetIndex, nextColumnCount - 1);
  const focusRow = getTableBodyRows(table)[0] ?? table.rows[0];

  return focusRow?.cells[focusIndex] ?? focusRow?.cells[0] ?? null;
}

function normalizeUrl(url) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return '';
  }

  if (/^(https?:|mailto:|tel:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function buildLinkHtml(url, text) {
  const normalizedUrl = normalizeUrl(url);

  return `<a href="${escapeAttribute(normalizedUrl)}" title="${escapeAttribute(normalizedUrl)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;
}

function buildTableHtml(rows = 2, columns = 2) {
  const safeRows = Math.max(rows, 1);
  const safeColumns = Math.max(columns, 1);
  const bodyRows = Array.from({ length: safeRows }, (_, rowIndex) => {
    const cells = Array.from(
      { length: safeColumns },
      (_, columnIndex) => `<td>${escapeHtml(`Cell ${rowIndex + 1}-${columnIndex + 1}`)}</td>`,
    ).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  return `<div class="editor-table-wrap"><table><tbody>${bodyRows}</tbody></table></div><p><br></p>`;
}

function ToolbarIcon({ name }) {
  const baseProps = {
    viewBox: '0 0 20 20',
    className: 'h-[1.05rem] w-[1.05rem]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.7',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'paragraph') {
    return (
      <svg {...baseProps}>
        <path d="M4 5.5h12" />
        <path d="M4 9.5h12" />
        <path d="M4 13.5h8.5" />
      </svg>
    );
  }

  if (name === 'heading1') {
    return (
      <svg {...baseProps}>
        <path d="M4.5 5v10" />
        <path d="M9.5 5v10" />
        <path d="M4.5 10h5" />
        <path d="M13.5 7.25 15 6v8" />
        <path d="M12.75 14h4.5" />
      </svg>
    );
  }

  if (name === 'heading2') {
    return (
      <svg {...baseProps}>
        <path d="M4.5 5v10" />
        <path d="M9.5 5v10" />
        <path d="M4.5 10h5" />
        <path d="M13 7.5a1.8 1.8 0 0 1 3.6 0c0 2-3.6 2.3-3.6 5h3.8" />
      </svg>
    );
  }

  if (name === 'bold') {
    return (
      <svg {...baseProps}>
        <path d="M6 4.5h4.9a2.3 2.3 0 1 1 0 4.6H6z" />
        <path d="M6 9.1h5.8a2.7 2.7 0 1 1 0 5.4H6z" />
      </svg>
    );
  }

  if (name === 'italic') {
    return (
      <svg {...baseProps}>
        <path d="M11.75 4.5h4" />
        <path d="M8.25 15.5h4" />
        <path d="M11.75 4.5 8.25 15.5" />
      </svg>
    );
  }

  if (name === 'underline') {
    return (
      <svg {...baseProps}>
        <path d="M5.5 4.5v4.25a4.5 4.5 0 0 0 9 0V4.5" />
        <path d="M4.5 15.5h11" />
      </svg>
    );
  }

  if (name === 'strike') {
    return (
      <svg {...baseProps}>
        <path d="M6 5.75c1-.9 2.15-1.25 3.45-1.25 2.05 0 3.8 1.02 3.8 2.65 0 1.2-.95 1.95-2.7 2.45l-1.6.45c-1.95.55-2.95 1.2-2.95 2.55 0 1.65 1.65 2.9 4.2 2.9 1.55 0 2.95-.38 4-1.2" />
        <path d="M3.75 10h12.5" />
      </svg>
    );
  }

  if (name === 'quote') {
    return (
      <svg {...baseProps}>
        <path d="M5.25 7.5h2.5v3h-2v2H4.25v-3.5A1.5 1.5 0 0 1 5.75 7.5Z" />
        <path d="M12.25 7.5h2.5v3h-2v2h-1.5v-3.5a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    );
  }

  if (name === 'bulletList') {
    return (
      <svg {...baseProps}>
        <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="5" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="5" cy="14" r="1" fill="currentColor" stroke="none" />
        <path d="M8 6h7" />
        <path d="M8 10h7" />
        <path d="M8 14h7" />
      </svg>
    );
  }

  if (name === 'numberedList') {
    return (
      <svg {...baseProps}>
        <path d="M4.25 5.5 5.5 4.75v3.5" />
        <path d="M3.8 9.1h2a1.15 1.15 0 0 1 .8 1.95L4 13h2.2" />
        <path d="M8.25 6h6.75" />
        <path d="M8.25 10h6.75" />
        <path d="M8.25 14h6.75" />
      </svg>
    );
  }

  if (name === 'link') {
    return (
      <svg {...baseProps}>
        <path d="M8.25 11.75 11.75 8.25" />
        <path d="M7.2 13.5H5.75a2.75 2.75 0 0 1 0-5.5H7.2" />
        <path d="M12.8 6.5h1.45a2.75 2.75 0 1 1 0 5.5H12.8" />
      </svg>
    );
  }

  if (name === 'checklist') {
    return (
      <svg {...baseProps}>
        <rect x="3.75" y="4.5" width="3" height="3" rx=".45" />
        <path d="m4.4 6 1 1 1.35-1.75" />
        <path d="M8.75 6h7" />
        <rect x="3.75" y="11.5" width="3" height="3" rx=".45" />
        <path d="M8.75 13h7" />
      </svg>
    );
  }

  if (name === 'divider') {
    return (
      <svg {...baseProps}>
        <circle cx="4" cy="10" r=".9" fill="currentColor" stroke="none" />
        <path d="M6.5 10h7" />
        <circle cx="16" cy="10" r=".9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === 'table') {
    return (
      <svg {...baseProps}>
        <rect x="3.5" y="4.5" width="13" height="11" rx="1.3" />
        <path d="M3.5 8.25h13" />
        <path d="M8 4.5v11" />
        <path d="M12.5 4.5v11" />
        <path d="M3.5 12h13" />
      </svg>
    );
  }

  if (name === 'arrowUp') {
    return (
      <svg {...baseProps}>
        <path d="M10 15V5" />
        <path d="m6.5 8.5 3.5-3.5 3.5 3.5" />
      </svg>
    );
  }

  if (name === 'arrowDown') {
    return (
      <svg {...baseProps}>
        <path d="M10 5v10" />
        <path d="m6.5 11.5 3.5 3.5 3.5-3.5" />
      </svg>
    );
  }

  if (name === 'arrowLeft') {
    return (
      <svg {...baseProps}>
        <path d="M15 10H5" />
        <path d="m8.5 6.5-3.5 3.5 3.5 3.5" />
      </svg>
    );
  }

  if (name === 'arrowRight') {
    return (
      <svg {...baseProps}>
        <path d="M5 10h10" />
        <path d="m11.5 6.5 3.5 3.5-3.5 3.5" />
      </svg>
    );
  }

  if (name === 'headerRow') {
    return (
      <svg {...baseProps}>
        <rect x="3.5" y="4.5" width="13" height="11" rx="1.3" />
        <path d="M3.5 8.25h13" />
        <path d="M8 8.25v7.25" />
        <path d="M12.5 8.25v7.25" />
      </svg>
    );
  }

  if (name === 'headerColumn') {
    return (
      <svg {...baseProps}>
        <rect x="3.5" y="4.5" width="13" height="11" rx="1.3" />
        <path d="M8 4.5v11" />
        <path d="M8 8.25h8.5" />
        <path d="M8 12h8.5" />
      </svg>
    );
  }

  if (name === 'image') {
    return (
      <svg {...baseProps}>
        <rect x="3.5" y="4.5" width="13" height="11" rx="1.5" />
        <circle cx="8" cy="8.25" r="1.2" />
        <path d="m5.5 13 3-3 2.5 2.5 1.75-1.75L14.5 13" />
      </svg>
    );
  }

  if (name === 'imageSizeSmall') {
    return (
      <svg {...baseProps}>
        <rect x="6.2" y="5.2" width="7.6" height="9.6" rx="1.2" />
      </svg>
    );
  }

  if (name === 'imageSizeMedium') {
    return (
      <svg {...baseProps}>
        <rect x="4.8" y="5.2" width="10.4" height="9.6" rx="1.2" />
      </svg>
    );
  }

  if (name === 'imageSizeLarge') {
    return (
      <svg {...baseProps}>
        <rect x="3.7" y="5.2" width="12.6" height="9.6" rx="1.2" />
      </svg>
    );
  }

  if (name === 'imageSizeFull') {
    return (
      <svg {...baseProps}>
        <rect x="2.8" y="5.2" width="14.4" height="9.6" rx="1.2" />
      </svg>
    );
  }

  return null;
}

function NoteEditor({ note, isReadOnly = false }) {
  const updateNote = useNotesStore((state) => state.updateNote);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const linkTextInputRef = useRef(null);
  const lastSyncedContentRef = useRef('');
  const pendingContentRef = useRef(null);
  const saveTimerRef = useRef(null);
  const savedRangeRef = useRef(null);
  const selectedImageRef = useRef(null);
  const selectedTableRef = useRef(null);
  const [toolbarState, setToolbarState] = useState(emptyToolbarState);
  const [selectedImageWidth, setSelectedImageWidth] = useState(null);
  const [selectedTableState, setSelectedTableState] = useState(null);
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ text: '', url: '' });

  const clearPendingSave = () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const flushPendingContent = (touchUpdatedAt = true) => {
    if (isReadOnly) {
      pendingContentRef.current = null;
      clearPendingSave();
      return;
    }

    const pendingContent = pendingContentRef.current;

    clearPendingSave();

    if (pendingContent == null || pendingContent === note.content) {
      pendingContentRef.current = null;
      return;
    }

    pendingContentRef.current = null;
    updateNote(note.id, { content: pendingContent }, { touchUpdatedAt });
  };

  const scheduleContentSave = () => {
    clearPendingSave();
    saveTimerRef.current = window.setTimeout(() => {
      flushPendingContent(false);
    }, 450);
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
      return;
    }

    savedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();

    if (!selection || !savedRangeRef.current) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  };

  const syncToolbarState = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (!isSelectionInsideEditor(editor) && document.activeElement !== editor) {
      setToolbarState((current) => (current === emptyToolbarState ? current : emptyToolbarState));
      return;
    }

    const nextToolbarState = {
      block: getActiveBlock(editor),
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      link: Boolean(getActiveLink(editor)),
    };

    setToolbarState((current) => {
      if (
        current.block === nextToolbarState.block &&
        current.bold === nextToolbarState.bold &&
        current.italic === nextToolbarState.italic &&
        current.underline === nextToolbarState.underline &&
        current.strikeThrough === nextToolbarState.strikeThrough &&
        current.insertUnorderedList === nextToolbarState.insertUnorderedList &&
        current.insertOrderedList === nextToolbarState.insertOrderedList &&
        current.link === nextToolbarState.link
      ) {
        return current;
      }

      return nextToolbarState;
    });
  };

  const isActionActive = (action) => {
    if (action.action === 'link') {
      return toolbarState.link || isLinkPanelOpen;
    }

    if (action.type !== 'command') {
      return false;
    }

    if (action.command === 'formatBlock') {
      return toolbarState.block === action.value;
    }

    return toolbarState[action.command];
  };

  useEffect(() => {
    const editor = editorRef.current;

    flushPendingContent(true);

    if (!editor) {
      return;
    }

    const nextHtml = toEditorHtml(note.content);

    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }

    lastSyncedContentRef.current = editor.innerHTML;
    syncToolbarState();
  }, [note.id, note.content]);

  useEffect(() => {
    selectedImageRef.current = null;
    setSelectedImageWidth(null);
    selectedTableRef.current = null;
    setSelectedTableState(null);
    setIsLinkPanelOpen(false);
    setLinkDraft({ text: '', url: '' });
  }, [note.id]);

  useEffect(() => {
    return () => {
      flushPendingContent(true);
    };
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncToolbarState);

    return () => {
      document.removeEventListener('selectionchange', syncToolbarState);
    };
  }, []);

  useEffect(() => {
    if (!isLinkPanelOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      linkTextInputRef.current?.focus();
      linkTextInputRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isLinkPanelOpen]);

  const commitEditorState = () => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const nextContent = editor.innerHTML === '<br>' ? '' : editor.innerHTML;

    if (nextContent === lastSyncedContentRef.current) {
      if (selectedImageRef.current && !editor.contains(selectedImageRef.current)) {
        selectedImageRef.current = null;
        setSelectedImageWidth(null);
      }

      if (selectedTableRef.current && !editor.contains(selectedTableRef.current)) {
        selectedTableRef.current = null;
        setSelectedTableState(null);
      }

      return;
    }

    lastSyncedContentRef.current = nextContent;
    pendingContentRef.current = nextContent;
    scheduleContentSave();
    refreshSelectedTable();
    syncToolbarState();
  };

  const runCommand = (command, value = null) => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    commitEditorState();
    syncToolbarState();
  };

  const insertHtml = (html) => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    commitEditorState();
    syncToolbarState();
  };

  const openLinkPanel = () => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    saveSelection();
    const range = savedRangeRef.current;
    const activeLink = getLinkFromRange(range);
    const selectedText = range?.toString().trim() ?? '';

    setLinkDraft({
      text: selectedText || activeLink?.textContent?.trim() || '',
      url: activeLink?.getAttribute('href') ?? '',
    });
    setIsLinkPanelOpen(true);
    clearSelectedImage();
    clearSelectedTable();
  };

  const closeLinkPanel = () => {
    setIsLinkPanelOpen(false);
    setLinkDraft({ text: '', url: '' });
  };

  const handleLinkDraftChange = (field, value) => {
    setLinkDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLinkApply = () => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedUrl = normalizeUrl(linkDraft.url);

    if (!normalizedUrl) {
      return;
    }

    const normalizedText = linkDraft.text.trim() || normalizedUrl;

    editor.focus();
    restoreSelection();
    const range = savedRangeRef.current;
    const activeLink = getLinkFromRange(range);
    const selection = window.getSelection();
    const hasSelectedText = selection && !selection.isCollapsed;

    if (activeLink && !hasSelectedText) {
      activeLink.setAttribute('href', normalizedUrl);
      activeLink.setAttribute('title', normalizedUrl);
      activeLink.setAttribute('target', '_blank');
      activeLink.setAttribute('rel', 'noreferrer');
      activeLink.textContent = normalizedText;
      saveSelection();
      commitEditorState();
      syncToolbarState();
      closeLinkPanel();
      return;
    }

    insertHtml(buildLinkHtml(normalizedUrl, normalizedText));
    closeLinkPanel();
  };

  const handleLinkRemove = () => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    restoreSelection();
    const range = savedRangeRef.current;
    const activeLink = getLinkFromRange(range);

    if (activeLink) {
      activeLink.replaceWith(document.createTextNode(activeLink.textContent ?? ''));
      saveSelection();
      commitEditorState();
      syncToolbarState();
    } else {
      document.execCommand('unlink', false);
      saveSelection();
      commitEditorState();
      syncToolbarState();
    }

    closeLinkPanel();
  };

  const handleChecklistInsert = () => {
    insertHtml(
      '<div class="editor-checklist-item"><input type="checkbox" data-editor-checkbox="true" contenteditable="false" /><div class="editor-checklist-text">Checklist item</div></div><p><br></p>',
    );
  };

  const handleDividerInsert = () => {
    insertHtml('<hr /><p><br></p>');
  };

  const handleTableInsert = () => {
    insertHtml(buildTableHtml());
  };

  const insertImage = (src, alt = 'Image') => {
    const safeSrc = escapeAttribute(src);
    const safeAlt = escapeAttribute(alt);
    const safeCaption = escapeHtml(alt);

    insertHtml(
      `<figure class="editor-image-block" data-image-width="100" style="--image-width: 100%;"><img src="${safeSrc}" alt="${safeAlt}" contenteditable="false" /><figcaption>${safeCaption}</figcaption></figure><p><br></p>`,
    );
  };

  const handleImageFiles = async (fileList) => {
    if (isReadOnly) {
      return;
    }

    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));

    if (!files.length) {
      return;
    }

    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      insertImage(dataUrl, file.name || 'Pasted image');
    }
  };

  const handleImageInsert = () => {
    if (isReadOnly) {
      return;
    }

    saveSelection();
    fileInputRef.current?.click();
  };

  const handleToolbarAction = (action) => {
    if (isReadOnly) {
      return;
    }

    if (action.type === 'command') {
      runCommand(action.command, action.value);
      return;
    }

    if (action.action === 'link') {
      openLinkPanel();
      return;
    }

    if (action.action === 'checklist') {
      handleChecklistInsert();
      return;
    }

    if (action.action === 'divider') {
      handleDividerInsert();
      return;
    }

    if (action.action === 'table') {
      handleTableInsert();
      return;
    }

    if (action.action === 'image') {
      handleImageInsert();
    }
  };

  const handleFileInputChange = async (event) => {
    if (isReadOnly) {
      event.target.value = '';
      return;
    }

    try {
      await handleImageFiles(event.target.files);
    } finally {
      event.target.value = '';
    }
  };

  const selectImage = (figure) => {
    selectedImageRef.current = figure;
    setSelectedImageWidth(getImageWidth(figure));
  };

  const clearSelectedImage = () => {
    selectedImageRef.current = null;
    setSelectedImageWidth(null);
  };

  const readSelectedTableState = (tableWrap) => {
    const table = tableWrap?.querySelector('table');

    if (!(table instanceof HTMLTableElement)) {
      return null;
    }

    const rows = getTableBodyRows(table).length;
    const columns = getTableColumnCount(table);

    return {
      rows,
      columns,
      headerRow: hasTableHeaderRow(table),
      headerColumn: hasTableHeaderColumn(table),
    };
  };

  const selectTable = (tableWrap) => {
    if (!(tableWrap instanceof HTMLElement)) {
      return;
    }

    if (selectedTableRef.current && selectedTableRef.current !== tableWrap) {
      selectedTableRef.current.dataset.selected = 'false';
    }

    selectedTableRef.current = tableWrap;
    tableWrap.dataset.selected = 'true';
    setSelectedTableState(readSelectedTableState(tableWrap));
  };

  const clearSelectedTable = () => {
    if (selectedTableRef.current) {
      selectedTableRef.current.dataset.selected = 'false';
    }

    selectedTableRef.current = null;
    setSelectedTableState(null);
  };

  const refreshSelectedTable = () => {
    const editor = editorRef.current;
    const tableWrap = selectedTableRef.current;

    if (!editor || !tableWrap || !editor.contains(tableWrap)) {
      clearSelectedTable();
      return null;
    }

    const nextState = readSelectedTableState(tableWrap);
    setSelectedTableState((current) => {
      if (
        current &&
        nextState &&
        current.rows === nextState.rows &&
        current.columns === nextState.columns &&
        current.headerRow === nextState.headerRow &&
        current.headerColumn === nextState.headerColumn
      ) {
        return current;
      }

      return nextState;
    });

    return tableWrap.querySelector('table');
  };

  const handleImageResize = (width) => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;
    const figure = selectedImageRef.current;

    if (!editor || !figure || !editor.contains(figure)) {
      clearSelectedImage();
      return;
    }

    setImageWidth(figure, width);
    setSelectedImageWidth(parseImageWidth(width));
    commitEditorState();
  };

  const applyTableMutation = (mutate) => {
    if (isReadOnly) {
      return;
    }

    const editor = editorRef.current;
    const table = refreshSelectedTable();

    if (!editor || !(table instanceof HTMLTableElement)) {
      return;
    }

    editor.focus();
    const focusTarget = mutate(table);
    refreshSelectedTable();
    commitEditorState();

    if (focusTarget instanceof HTMLElement) {
      focusElementStart(focusTarget);
    }

    saveSelection();
    syncToolbarState();
  };

  const handleTableExpand = (side) => {
    applyTableMutation((table) => {
      if (side === 'top' || side === 'bottom') {
        return addTableRow(table, side);
      }

      return addTableColumn(table, side);
    });
  };

  const handleTableDelete = (side) => {
    applyTableMutation((table) => {
      if (side === 'top' || side === 'bottom') {
        return removeTableRow(table, side);
      }

      return removeTableColumn(table, side);
    });
  };

  const handleTableHeaderToggle = (direction) => {
    applyTableMutation((table) => {
      if (direction === 'horizontal') {
        return setTableHeaderRow(table, !hasTableHeaderRow(table));
      }

      applyTableHeaderColumn(table, !hasTableHeaderColumn(table));
      return getTableBodyRows(table)[0]?.cells[0] ?? table.rows[0]?.cells[0] ?? null;
    });
  };

  const handleTableKeyDown = (event) => {
    if (isReadOnly) {
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const editor = editorRef.current;
    const cell = getTableCell(event.target);

    if (!editor || !cell || !editor.contains(cell)) {
      return;
    }

    const table = cell.closest('table');

    if (!(table instanceof HTMLTableElement)) {
      return;
    }

    const cells = Array.from(table.querySelectorAll('th, td'));
    const currentIndex = cells.indexOf(cell);

    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();
    const offset = event.shiftKey ? -1 : 1;
    let nextCell = cells[currentIndex + offset] ?? null;

    if (!nextCell && !event.shiftKey) {
      nextCell = addTableRow(table, 'bottom');
      commitEditorState();
      refreshSelectedTable();
    }

    if (!nextCell) {
      nextCell = cells[Math.max(currentIndex + offset, 0)] ?? cell;
    }

    focusElementStart(nextCell);
    saveSelection();
    syncToolbarState();
  };

  const canDeleteTableRows = selectedTableState ? selectedTableState.rows > 1 : false;
  const canDeleteTableColumns = selectedTableState ? selectedTableState.columns > 1 : false;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-8 md:py-9">
      <div className="mx-auto flex min-h-0 w-full max-w-[1220px] flex-1 flex-col overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <input
          type="text"
          value={note.title}
          readOnly={isReadOnly}
          onChange={(event) => updateNote(note.id, { title: event.target.value })}
          placeholder={isReadOnly ? 'Untitled note' : 'Untitled'}
          className={`w-full border-0 bg-transparent p-0 font-serif text-[2rem] font-medium tracking-calm text-ink placeholder:text-muted/75 focus:outline-none focus:ring-0 md:text-[3.1rem] ${
            isReadOnly ? 'cursor-default' : ''
          }`}
        />

        {isReadOnly ? (
          <div className="mt-4 rounded-[22px] border border-line/70 bg-panel/72 px-4 py-3 text-sm leading-6 text-muted md:mt-5">
            This note is in Trash. Restore it to edit again, or delete it permanently.
          </div>
        ) : (
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-3 md:mt-5 md:border-b md:border-line/70 md:pb-4">
            {toolbarActions.map((action) => (
              <button
                key={action.id}
                type="button"
                title={action.title}
                aria-label={action.title}
                aria-pressed={isActionActive(action)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleToolbarAction(action)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-accent md:h-10 md:w-10 ${
                  isActionActive(action)
                    ? 'border-accent bg-accent text-ink shadow-sm'
                    : 'border-line/70 bg-elevated/72 text-muted hover:border-line hover:bg-panel hover:text-ink'
                }`}
              >
                <ToolbarIcon name={action.icon} />
              </button>
            ))}
          </div>
        )}

        {!isReadOnly && isLinkPanelOpen ? (
          <form
            className="mt-3 flex flex-col gap-2 rounded-[22px] border border-line/70 bg-panel/72 p-3 md:mt-4 md:flex-row md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              handleLinkApply();
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/70 bg-elevated/70 text-muted">
              <ToolbarIcon name="link" />
            </span>
            <input
              ref={linkTextInputRef}
              type="text"
              value={linkDraft.text}
              onChange={(event) => handleLinkDraftChange('text', event.target.value)}
              placeholder="Display text"
              className="min-w-0 flex-1 rounded-full border border-line/80 bg-elevated/85 px-4 py-2 text-sm text-ink placeholder:text-muted/75 focus:border-accent focus:outline-none"
            />
            <input
              type="url"
              value={linkDraft.url}
              onChange={(event) => handleLinkDraftChange('url', event.target.value)}
              placeholder="Paste a link"
              className="min-w-0 flex-[1.3] rounded-full border border-line/80 bg-elevated/85 px-4 py-2 text-sm text-ink placeholder:text-muted/75 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full border border-accent bg-accent px-4 py-2 text-sm text-ink transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Apply
            </button>
            {(toolbarState.link || linkDraft.url.trim()) ? (
              <button
                type="button"
                onClick={handleLinkRemove}
                className="rounded-full border border-line/80 bg-elevated/85 px-4 py-2 text-sm text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeLinkPanel}
              className="rounded-full border border-line/80 bg-elevated/85 px-4 py-2 text-sm text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Cancel
            </button>
          </form>
        ) : null}

        {!isReadOnly && selectedImageWidth ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-[22px] border border-line/70 bg-panel/72 px-3 py-2 md:mt-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line/70 bg-elevated/70 text-muted">
              <ToolbarIcon name="image" />
            </span>
            {imageSizeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.title}
                aria-label={option.title}
                aria-pressed={selectedImageWidth === option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleImageResize(option.value)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-accent ${
                  selectedImageWidth === option.value
                    ? 'border-accent bg-accent text-ink shadow-sm'
                    : 'border-line/80 bg-elevated/85 text-muted hover:border-line hover:bg-panel hover:text-ink'
                }`}
              >
                <ToolbarIcon name={option.icon} />
              </button>
            ))}
          </div>
        ) : null}

        {!isReadOnly && selectedTableState ? (
          <>
            <div className="mt-3 rounded-[24px] border border-line/70 bg-panel/78 px-3 py-3 shadow-[0_12px_34px_rgba(30,26,22,0.06)] md:hidden">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/70 bg-elevated/80 text-muted">
                      <ToolbarIcon name="table" />
                    </span>
                    <div className="min-w-0">
                      <p>Table Studio</p>
                      <p className="mt-1 text-sm normal-case tracking-normal text-ink">
                        Grow or trim the grid from any edge, then lock in headers for easier mobile writing.
                      </p>
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-line/70 bg-elevated/78 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted">
                  {selectedTableState.rows} rows . {selectedTableState.columns} cols
                </span>
              </div>

              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-line/70 bg-elevated/62 p-3">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted">Add Edge</p>
                    <div className="grid grid-cols-3 gap-2">
                      {tableExpandActions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          title={action.label}
                          aria-label={action.label}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleTableExpand(action.side)}
                          className={`flex min-h-11 items-center justify-center rounded-[18px] border border-line/80 bg-panel/88 px-3 py-3 text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent ${action.className}`}
                        >
                          <ToolbarIcon name={action.icon} />
                        </button>
                      ))}
                      <div className="col-start-2 row-start-2 flex min-h-11 items-center justify-center rounded-[18px] border border-accent/70 bg-accent/30 px-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-ink">
                        Add
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-line/70 bg-elevated/62 p-3">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted">Remove Edge</p>
                    <div className="grid grid-cols-3 gap-2">
                      {tableDeleteActions.map((action) => {
                        const isDisabled =
                          action.side === 'top' || action.side === 'bottom'
                            ? !canDeleteTableRows
                            : !canDeleteTableColumns;

                        return (
                          <button
                            key={action.id}
                            type="button"
                            title={action.label}
                            aria-label={action.label}
                            disabled={isDisabled}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleTableDelete(action.side)}
                            className={`flex min-h-11 items-center justify-center rounded-[18px] border px-3 py-3 transition focus:outline-none focus:ring-2 focus:ring-accent ${
                              isDisabled
                                ? 'cursor-not-allowed border-line/60 bg-elevated/55 text-muted/45'
                                : `border-line/80 bg-panel/88 text-muted hover:border-line hover:bg-panel hover:text-ink ${action.className}`
                            } ${isDisabled ? action.className : ''}`}
                          >
                            <ToolbarIcon name={action.icon} />
                          </button>
                        );
                      })}
                      <div className="col-start-2 row-start-2 flex min-h-11 items-center justify-center rounded-[18px] border border-line/70 bg-elevated/55 px-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                        Trim
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {tableHeaderActions.map((action) => {
                    const isActive =
                      action.direction === 'horizontal'
                        ? selectedTableState.headerRow
                        : selectedTableState.headerColumn;

                    return (
                      <button
                        key={action.id}
                        type="button"
                        aria-pressed={isActive}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleTableHeaderToggle(action.direction)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
                          isActive
                            ? 'border-accent bg-accent text-ink'
                            : 'border-line/80 bg-elevated/88 text-muted hover:border-line hover:bg-panel hover:text-ink'
                        }`}
                      >
                        <ToolbarIcon name={action.icon} />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-sm text-muted">
                Swipe sideways when the grid grows wider. Headers stay easier to track on smaller screens.
              </p>
            </div>

            <div className="mt-4 hidden items-center gap-2 overflow-x-auto rounded-[22px] border border-line/70 bg-panel/72 px-3 py-2 md:flex">
              <span className="flex h-9 min-w-0 shrink-0 items-center gap-2 rounded-full border border-line/70 bg-elevated/70 px-3 text-xs uppercase tracking-[0.18em] text-muted">
                <ToolbarIcon name="table" />
                <span>{selectedTableState.rows} x {selectedTableState.columns}</span>
              </span>
              {tableExpandActions.map((action) => (
                <button
                  key={`desktop-add-${action.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleTableExpand(action.side)}
                  className="rounded-full border border-line/80 bg-elevated/85 px-4 py-2 text-sm text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {action.label}
                </button>
              ))}
              {tableDeleteActions.map((action) => {
                const isDisabled =
                  action.side === 'top' || action.side === 'bottom'
                    ? !canDeleteTableRows
                    : !canDeleteTableColumns;

                return (
                  <button
                    key={`desktop-delete-${action.id}`}
                    type="button"
                    disabled={isDisabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleTableDelete(action.side)}
                    className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
                      isDisabled
                        ? 'cursor-not-allowed border-line/60 bg-elevated/60 text-muted/45'
                        : 'border-line/80 bg-elevated/85 text-muted hover:border-line hover:bg-panel hover:text-ink'
                    }`}
                  >
                    {action.label}
                  </button>
                );
              })}
              {tableHeaderActions.map((action) => {
                const isActive =
                  action.direction === 'horizontal'
                    ? selectedTableState.headerRow
                    : selectedTableState.headerColumn;

                return (
                  <button
                    key={`desktop-header-${action.id}`}
                    type="button"
                    aria-pressed={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleTableHeaderToggle(action.direction)}
                    className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent ${
                      isActive
                        ? 'border-accent bg-accent text-ink'
                        : 'border-line/80 bg-elevated/85 text-muted hover:border-line hover:bg-panel hover:text-ink'
                    }`}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        <div className="mt-2 flex min-h-[min(58dvh,28rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-line/70 bg-elevated/72 shadow-panel md:mt-5 md:min-h-[360px] md:rounded-[28px] md:border-line/75 md:bg-elevated/80 md:h-[clamp(32rem,64dvh,46rem)] md:min-h-0 md:flex-none">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted md:px-4 md:py-3 md:text-xs">
            <span className="hidden md:inline">{isReadOnly ? 'Trashed note' : 'Rich text editor'}</span>
            <span className="md:hidden">{isReadOnly ? 'Trash preview' : 'Writing space'}</span>
            <span>
              {isReadOnly
                ? 'Restore to continue editing'
                : getPlainTextFromContent(note.content).trim()
                  ? 'Formatting saves live'
                  : 'Start writing'}
            </span>
          </div>

          <div
            ref={editorRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            data-placeholder={isReadOnly ? '' : 'Start writing.'}
            onInput={isReadOnly ? undefined : commitEditorState}
            onBlur={() => {
              commitEditorState();
              saveSelection();
              flushPendingContent(true);
            }}
            onFocus={() => {
              saveSelection();
              syncToolbarState();
            }}
            onKeyUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onKeyDown={handleTableKeyDown}
            onMouseUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onClick={(event) => {
              const imageFigure = getImageFigure(event.target);
              const tableWrap = getTableWrap(event.target);
              const clickedLink =
                event.target instanceof Element ? event.target.closest('a[href]') : null;

              if (clickedLink instanceof HTMLAnchorElement) {
                if (event.metaKey || event.ctrlKey) {
                  event.preventDefault();
                  window.open(clickedLink.href, '_blank', 'noopener,noreferrer');
                  saveSelection();
                  syncToolbarState();
                  return;
                }

                saveSelection();
                syncToolbarState();
                return;
              }

              if (imageFigure) {
                selectImage(imageFigure);
              } else {
                clearSelectedImage();
              }

              if (tableWrap) {
                selectTable(tableWrap);
              } else {
                clearSelectedTable();
              }

              if (event.target instanceof HTMLInputElement && event.target.dataset.editorCheckbox) {
                commitEditorState();
              }

              saveSelection();
              syncToolbarState();
            }}
            onPaste={async (event) => {
              if (isReadOnly) {
                return;
              }

              const imageItems = Array.from(event.clipboardData.items).filter((item) =>
                item.type.startsWith('image/'),
              );

              if (imageItems.length > 0) {
                event.preventDefault();
                saveSelection();
                await handleImageFiles(imageItems.map((item) => item.getAsFile()).filter(Boolean));
                return;
              }

              event.preventDefault();
              const text = event.clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
              commitEditorState();
            }}
            className={`editor-surface min-h-0 flex-1 overflow-y-auto overscroll-contain border-0 bg-transparent px-4 py-4 text-[15px] leading-8 text-ink focus:outline-none md:text-base ${
              isReadOnly ? 'cursor-default' : ''
            }`}
          />
        </div>
      </div>
    </section>
  );
}

export default NoteEditor;
