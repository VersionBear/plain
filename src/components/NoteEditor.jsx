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
  { id: 'image', title: 'Insert image', icon: 'image', type: 'custom', action: 'image' },
];

const imageSizeOptions = [
  { value: 35, title: 'Small image', icon: 'imageSizeSmall' },
  { value: 55, title: 'Medium image', icon: 'imageSizeMedium' },
  { value: 75, title: 'Large image', icon: 'imageSizeLarge' },
  { value: 100, title: 'Full width image', icon: 'imageSizeFull' },
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

function getImageWidth(figure) {
  return parseImageWidth(figure?.dataset.imageWidth ?? figure?.style.getPropertyValue('--image-width'));
}

function setImageWidth(figure, width) {
  const normalizedWidth = parseImageWidth(width);
  figure.dataset.imageWidth = String(normalizedWidth);
  figure.style.setProperty('--image-width', `${normalizedWidth}%`);
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

function NoteEditor({ note }) {
  const updateNote = useNotesStore((state) => state.updateNote);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const linkTextInputRef = useRef(null);
  const lastSyncedContentRef = useRef('');
  const savedRangeRef = useRef(null);
  const selectedImageRef = useRef(null);
  const [toolbarState, setToolbarState] = useState(emptyToolbarState);
  const [selectedImageWidth, setSelectedImageWidth] = useState(null);
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ text: '', url: '' });

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
    setIsLinkPanelOpen(false);
    setLinkDraft({ text: '', url: '' });
  }, [note.id]);

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
      return;
    }

    lastSyncedContentRef.current = nextContent;
    updateNote(note.id, { content: nextContent });
    syncToolbarState();
  };

  const runCommand = (command, value = null) => {
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

  const insertImage = (src, alt = 'Image') => {
    const safeSrc = escapeAttribute(src);
    const safeAlt = escapeAttribute(alt);
    const safeCaption = escapeHtml(alt);

    insertHtml(
      `<figure class="editor-image-block" data-image-width="100" style="--image-width: 100%;"><img src="${safeSrc}" alt="${safeAlt}" contenteditable="false" /><figcaption>${safeCaption}</figcaption></figure><p><br></p>`,
    );
  };

  const handleImageFiles = async (fileList) => {
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
    saveSelection();
    fileInputRef.current?.click();
  };

  const handleToolbarAction = (action) => {
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

    if (action.action === 'image') {
      handleImageInsert();
    }
  };

  const handleFileInputChange = async (event) => {
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

  const handleImageResize = (width) => {
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

  return (
    <section className="flex min-h-0 flex-1 flex-col px-5 py-7 md:px-8 md:py-9">
      <div className="mx-auto flex min-h-0 w-full max-w-[1220px] flex-1 flex-col">
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
          onChange={(event) => updateNote(note.id, { title: event.target.value })}
          placeholder="Untitled"
          className="w-full border-0 bg-transparent p-0 font-serif text-[2.3rem] font-medium tracking-calm text-ink placeholder:text-muted/75 focus:outline-none focus:ring-0 md:text-[3.1rem]"
        />

        <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto border-b border-line/70 px-1 pb-4">
          {toolbarActions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.title}
              aria-label={action.title}
              aria-pressed={isActionActive(action)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleToolbarAction(action)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-accent ${
                isActionActive(action)
                  ? 'border-accent bg-accent text-ink shadow-sm'
                  : 'border-line/80 bg-elevated/85 text-muted hover:border-line hover:bg-panel hover:text-ink'
              }`}
            >
              <ToolbarIcon name={action.icon} />
            </button>
          ))}
        </div>

        {isLinkPanelOpen ? (
          <form
            className="mt-4 flex flex-col gap-2 rounded-[22px] border border-line/70 bg-panel/75 p-3 md:flex-row md:items-center"
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

        {selectedImageWidth ? (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-[22px] border border-line/70 bg-panel/75 px-3 py-2">
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

        <div className="mt-5 flex min-h-[360px] min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-line/75 bg-elevated/80 shadow-panel md:min-h-[520px]">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted">
            <span>Rich text editor</span>
            <span>{getPlainTextFromContent(note.content).trim() ? 'Formatting saves live' : 'Start writing'}</span>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Start writing."
            onInput={commitEditorState}
            onBlur={() => {
              commitEditorState();
              saveSelection();
            }}
            onFocus={() => {
              saveSelection();
              syncToolbarState();
            }}
            onKeyUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onMouseUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onClick={(event) => {
              const imageFigure = getImageFigure(event.target);
              const clickedLink =
                event.target instanceof Element ? event.target.closest('a[href]') : null;

              if (clickedLink instanceof HTMLAnchorElement) {
                event.preventDefault();
                window.open(clickedLink.href, '_blank', 'noopener,noreferrer');
                saveSelection();
                syncToolbarState();
                return;
              }

              if (imageFigure) {
                selectImage(imageFigure);
              } else {
                clearSelectedImage();
              }

              if (event.target instanceof HTMLInputElement && event.target.dataset.editorCheckbox) {
                commitEditorState();
              }

              saveSelection();
              syncToolbarState();
            }}
            onPaste={async (event) => {
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
            className="editor-surface min-h-0 flex-1 overflow-y-auto border-0 bg-transparent px-4 py-4 text-[15px] leading-8 text-ink focus:outline-none md:text-base"
          />
        </div>
      </div>
    </section>
  );
}

export default NoteEditor;
