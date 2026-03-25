import { useEffect, useRef, useState, useCallback } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Typography } from '@tiptap/extension-typography';
import {
  Bold, Italic, Strikethrough, Link as LinkIcon,
  Quote, Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Table as TableIcon,
  List, ListOrdered, CheckSquare, ExternalLink, X
} from 'lucide-react';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));

    reader.readAsDataURL(file);
  });
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

function NoteEditor({ note, isReadOnly = false }) {
  const updateNote = useNotesStore((state) => state.updateNote);
  const saveTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const linkButtonRef = useRef(null);
  const linkPopoverRef = useRef(null);
  const linkInputRef = useRef(null);
  const linkSelectionRef = useRef(null);
  const linkTooltipRef = useRef(null);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isLinkTooltipOpen, setIsLinkTooltipOpen] = useState(false);
  const [activeLinkHref, setActiveLinkHref] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing... (Use markdown shortcuts like # or * )',
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
    ],
    content: note.content || '',
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      saveTimerRef.current = setTimeout(() => {
        updateNote(note.id, { content: html }, { touchUpdatedAt: true });
      }, 500);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[50vh]',
      },
    },
  });

  // Sync content when note changes (from sidebar selection)
  useEffect(() => {
    if (editor && note.id) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '', false);
      }
    }
  }, [note.id, editor]); // Exclude note.content to prevent cursor jumping

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  useEffect(() => {
    if (!isLinkPopoverOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (
        linkPopoverRef.current?.contains(target) ||
        linkButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsLinkPopoverOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isLinkPopoverOpen]);

  useEffect(() => {
    if (!isLinkTooltipOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (linkTooltipRef.current?.contains(target)) {
        return;
      }

      setIsLinkTooltipOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isLinkTooltipOpen]);

  useEffect(() => {
    if (!isLinkPopoverOpen) {
      return;
    }

    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  }, [isLinkPopoverOpen]);

  useEffect(() => {
    if (!isLinkTooltipOpen) {
      return;
    }

    linkInputRef.current?.focus();
  }, [isLinkTooltipOpen]);

  useEffect(() => {
    setIsLinkPopoverOpen(false);
  }, [note.id]);

  const openLinkPopover = useCallback(() => {
    if (!editor) {
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const isUrlSelected = selectedText && /^https?:\/\/\S+$/i.test(selectedText.trim());
    
    linkSelectionRef.current = { from, to };
    
    if (isUrlSelected) {
      // URL is selected - use it as URL, prompt for display text
      setLinkUrl(selectedText.trim());
      setLinkText('');
    } else if (editor.isActive('link')) {
      // Cursor is on an existing link
      const attrs = editor.getAttributes('link');
      setLinkUrl(attrs.href || '');
      setLinkText(selectedText || '');
      setActiveLinkHref(attrs.href || '');
      setIsLinkTooltipOpen(true);
      return;
    } else {
      // Regular text selected or no selection
      setLinkUrl('');
      setLinkText(selectedText || '');
    }
    
    setActiveLinkHref('');
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const closeLinkPopover = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setActiveLinkHref('');
  }, []);

  const closeLinkTooltip = useCallback(() => {
    setIsLinkTooltipOpen(false);
    setActiveLinkHref('');
  }, []);

  const applyLink = useCallback((event) => {
    event.preventDefault();

    if (!editor) {
      return;
    }

    const selection = linkSelectionRef.current ?? {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    const normalizedUrl = normalizeUrl(linkUrl);
    
    // If link text is provided and different from selection, replace text
    if (linkText && linkText !== editor.state.doc.textBetween(selection.from, selection.to, ' ')) {
      editor.chain()
        .focus()
        .setTextSelection(selection)
        .deleteSelection()
        .insertContent(linkText)
        .extendMarkRange('link')
        .setLink({ href: normalizedUrl })
        .run();
    } else if (!normalizedUrl) {
      // No URL - remove link
      editor.chain()
        .focus()
        .setTextSelection(selection)
        .extendMarkRange('link')
        .unsetLink()
        .run();
    } else {
      // Just apply/update the link
      editor.chain()
        .focus()
        .setTextSelection(selection)
        .extendMarkRange('link')
        .setLink({ href: normalizedUrl })
        .run();
    }

    setLinkUrl('');
    setLinkText('');
    setIsLinkPopoverOpen(false);
    setActiveLinkHref('');
  }, [editor, linkUrl, linkText]);

  const removeLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const selection = linkSelectionRef.current ?? {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };

    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .extendMarkRange('link')
      .unsetLink()
      .run();

    setLinkUrl('');
    setLinkText('');
    setIsLinkPopoverOpen(false);
    setIsLinkTooltipOpen(false);
    setActiveLinkHref('');
  }, [editor]);

  const addImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(async (event) => {
    const [file] = event.target.files ?? [];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    try {
      const src = await readFileAsDataUrl(file);
      editor
        ?.chain()
        .focus()
        .setImage({ src, alt: file.name })
        .run();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to upload image.');
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleLinkMouseOver = useCallback((event) => {
    if (!editor || isReadOnly) return;
    
    const pos = editor.view.posAtDOM(event.target, 0);
    const { state } = editor.view;
    const resolvedPos = state.doc.resolve(pos);
    const marks = resolvedPos.marks();
    const linkMark = marks.find(mark => mark.type.name === 'link');
    
    if (linkMark) {
      setActiveLinkHref(linkMark.attrs.href);
      setIsLinkTooltipOpen(true);
      setIsLinkPopoverOpen(false);
    }
  }, [editor, isReadOnly]);

  const handleLinkMouseOut = useCallback((event) => {
    if (!editor || isReadOnly) return;
    
    const relatedTarget = event.relatedTarget;
    if (linkTooltipRef.current?.contains(relatedTarget)) {
      return;
    }
    
    setIsLinkTooltipOpen(false);
    setActiveLinkHref('');
  }, [editor, isReadOnly]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-32">
      <input
        type="text"
        value={note.title}
        readOnly={isReadOnly}
        onChange={(event) => updateNote(note.id, { title: event.target.value })}
        placeholder={isReadOnly ? 'Untitled note' : 'Note Title'}
        className={`w-full bg-transparent border-0 p-0 text-3xl md:text-4xl font-semibold tracking-tight text-ink placeholder-muted/50 focus:outline-none focus:ring-0 transition-colors ${
          isReadOnly ? 'cursor-default' : ''
        }`}
      />

      {isReadOnly ? (
        <div className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          This note is in Trash. Restore it to edit again, or delete it permanently.
        </div>
      ) : (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="sticky top-0 z-10 -mx-4 mb-4">
            <div className="flex gap-1 overflow-x-auto border-b border-line bg-canvas/90 px-4 py-2 shadow-sm backdrop-blur">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Bold">
                <Bold size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Italic">
                <Italic size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Strikethrough">
                <Strikethrough size={16} />
              </button>
              
              <div className="w-px h-6 bg-line self-center mx-1 shrink-0" />
              
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Heading 1">
                <Heading1 size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Heading 2">
                <Heading2 size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Quote">
                <Quote size={16} />
              </button>

              <div className="w-px h-6 bg-line self-center mx-1 shrink-0" />

              <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Align Left">
                <AlignLeft size={16} />
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Align Center">
                <AlignCenter size={16} />
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Align Right">
                <AlignRight size={16} />
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Justify">
                <AlignJustify size={16} />
              </button>

              <div className="w-px h-6 bg-line self-center mx-1 shrink-0" />

              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Bullet List">
                <List size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Numbered List">
                <ListOrdered size={16} />
              </button>
              <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('taskList') ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`} title="Task List">
                <CheckSquare size={16} />
              </button>

              <div className="w-px h-6 bg-line self-center mx-1 shrink-0" />

              <button
                ref={linkButtonRef}
                onMouseDown={(event) => {
                  event.preventDefault();
                  openLinkPopover();
                }}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('link') || isLinkPopoverOpen ? 'bg-line/50 text-ink' : 'text-muted hover:text-ink hover:bg-line/30'}`}
                title="Link"
              >
                <LinkIcon size={16} />
              </button>
              <button onClick={addImage} className="p-2 rounded-lg transition-colors text-muted hover:text-ink hover:bg-line/30" title="Upload Image">
                <ImageIcon size={16} />
              </button>
              <button onClick={addTable} className="p-2 rounded-lg transition-colors text-muted hover:text-ink hover:bg-line/30" title="Table">
                <TableIcon size={16} />
              </button>
            </div>

            {isLinkPopoverOpen ? (
              <form
                ref={linkPopoverRef}
                onSubmit={applyLink}
                className="absolute top-full left-4 right-4 z-20 mt-3 rounded-2xl border border-line bg-panel p-4 shadow-xl md:left-auto md:right-4 md:w-96"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Add link</p>
                    <p className="mt-1 text-xs text-muted">Add a link to the selected text or paste a URL.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeLinkPopover}
                    className="rounded-lg p-1 text-muted transition-colors hover:bg-line/30 hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">Text to display</span>
                    <input
                      ref={linkInputRef}
                      type="text"
                      value={linkText}
                      onChange={(event) => setLinkText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          closeLinkPopover();
                        } else if (event.key === 'Enter') {
                          event.preventDefault();
                          applyLink(event);
                        }
                      }}
                      placeholder="Enter display text"
                      className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">URL</span>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          closeLinkPopover();
                        } else if (event.key === 'Enter') {
                          event.preventDefault();
                          applyLink(event);
                        }
                      }}
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={removeLink}
                    className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-line/30 hover:text-ink"
                  >
                    Remove
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeLinkPopover}
                      className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-line/30 hover:text-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            {isLinkTooltipOpen && activeLinkHref ? (
              <div
                ref={linkTooltipRef}
                className="absolute top-full left-4 z-20 mt-2 flex items-center gap-2 rounded-xl border border-line bg-elevated p-2 shadow-lg"
              >
                <a
                  href={activeLinkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-[200px] items-center gap-1.5 truncate text-sm text-ink hover:underline"
                >
                  <ExternalLink size={14} />
                  <span className="truncate">{activeLinkHref}</span>
                </a>
                <div className="h-4 w-px bg-line" />
                <button
                  type="button"
                  onClick={openLinkPopover}
                  className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={removeLink}
                  className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={closeLinkTooltip}
                  className="rounded-lg p-1 text-muted transition-colors hover:bg-line/30 hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Editor Content Area */}
      <div 
        className="flex-1 text-[15px] leading-relaxed text-ink/90 focus:outline-none min-h-[50vh]"
        onMouseOver={handleLinkMouseOver}
        onMouseOut={handleLinkMouseOut}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default NoteEditor;
