import { EditorContent, useEditor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteTagsInput from './NoteTagsInput';
import EditorToolbar from './editor/EditorToolbar';
import { getNoteEditorExtensions } from './editor/editorExtensions';
import { insertImageFiles } from './editor/imageUtils';
import LinkPopover from './editor/LinkPopover';
import LinkTooltip from './editor/LinkTooltip';
import { isUrlLikeSelection, normalizeUrl } from './editor/linkUtils';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { registerActiveEditorDrafts } from '../utils/editorDraftRegistry';
import { writeDraftRecoverySnapshot } from '../utils/draftRecovery';
import clsx from 'clsx';

function NoteEditor({ note, isReadOnly = false }) {
  const updateNote = useNotesStore((state) => state.updateNote);
  const isCompactMode = useSettingsStore((state) => state.isCompactMode);
  const titleSaveTimerRef = useRef(null);
  const contentSaveTimerRef = useRef(null);
  const pendingTitleRef = useRef(note.title || '');
  const pendingContentRef = useRef(note.content || '');
  const previousNoteIdRef = useRef(note.id);
  const imageInputRef = useRef(null);
  const linkButtonRef = useRef(null);
  const linkPopoverRef = useRef(null);
  const linkInputRef = useRef(null);
  const linkSelectionRef = useRef(null);
  const linkTooltipRef = useRef(null);
  const [titleDraft, setTitleDraft] = useState(note.title || '');
  const [imageError, setImageError] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isLinkTooltipOpen, setIsLinkTooltipOpen] = useState(false);
  const [activeLinkHref, setActiveLinkHref] = useState('');

  const flushTitleSave = useCallback(() => {
    if (!titleSaveTimerRef.current) {
      return;
    }

    clearTimeout(titleSaveTimerRef.current);
    titleSaveTimerRef.current = null;
    updateNote(note.id, { title: pendingTitleRef.current });
  }, [note.id, updateNote]);

  const scheduleTitleSave = useCallback(
    (nextTitle) => {
      pendingTitleRef.current = nextTitle;
      writeDraftRecoverySnapshot(note, {
        title: nextTitle,
        content: pendingContentRef.current,
      });

      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current);
      }

      titleSaveTimerRef.current = setTimeout(() => {
        updateNote(note.id, { title: nextTitle });
        titleSaveTimerRef.current = null;
      }, 300);
    },
    [note, updateNote],
  );

  const flushContentSave = useCallback(() => {
    if (!contentSaveTimerRef.current) {
      return;
    }

    clearTimeout(contentSaveTimerRef.current);
    contentSaveTimerRef.current = null;
    updateNote(
      note.id,
      { content: pendingContentRef.current },
      { touchUpdatedAt: true },
    );
  }, [note.id, updateNote]);

  const flushDrafts = useCallback(() => {
    flushTitleSave();
    flushContentSave();
  }, [flushContentSave, flushTitleSave]);

  const editor = useEditor({
    extensions: getNoteEditorExtensions(),
    content: note.content || '',
    editable: !isReadOnly,
    onUpdate: ({ editor: nextEditor }) => {
      const html = nextEditor.getHTML();
      pendingContentRef.current = html;
      writeDraftRecoverySnapshot(note, {
        title: pendingTitleRef.current,
        content: html,
      });

      if (contentSaveTimerRef.current) {
        clearTimeout(contentSaveTimerRef.current);
      }

      contentSaveTimerRef.current = setTimeout(() => {
        updateNote(note.id, { content: html }, { touchUpdatedAt: true });
        contentSaveTimerRef.current = null;
      }, 500);
    },
    editorProps: {
      attributes: {
        class: clsx(
          'note-prose prose dark:prose-invert focus:outline-none max-w-none min-h-[50vh]',
          isCompactMode ? 'prose-compact' : '',
        ),
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          (file) => file.type.startsWith('image/'),
        );

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();
        void insertImageFiles(editor, files);
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(
          (file) => file.type.startsWith('image/'),
        );

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();

        const position = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;

        void insertImageFiles(editor, files, { position });
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextTitle = note.title || '';
    const nextContent = note.content || '';
    const noteChanged = previousNoteIdRef.current !== note.id;
    const hasExternalContentChange = nextContent !== pendingContentRef.current;

    if (noteChanged || nextTitle !== pendingTitleRef.current) {
      setTitleDraft(nextTitle);
      pendingTitleRef.current = nextTitle;
    }

    if (
      noteChanged ||
      (hasExternalContentChange && editor.getHTML() !== nextContent)
    ) {
      pendingContentRef.current = nextContent;
      editor.commands.setContent(nextContent, false);
    }

    if (noteChanged) {
      setImageError('');
      setIsLinkPopoverOpen(false);
      setIsLinkTooltipOpen(false);
      setLinkText('');
      setLinkUrl('');
      setActiveLinkHref('');
    }

    previousNoteIdRef.current = note.id;
  }, [editor, note.id, note.title, note.content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  useEffect(() => {
    return () => {
      flushDrafts();
    };
  }, [flushDrafts]);

  useEffect(() => {
    if (isReadOnly) {
      return undefined;
    }

    return registerActiveEditorDrafts(note.id, flushDrafts);
  }, [flushDrafts, isReadOnly, note.id]);

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

  const closeLinkPopover = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setActiveLinkHref('');
  }, []);

  const closeLinkTooltip = useCallback(() => {
    setIsLinkTooltipOpen(false);
    setActiveLinkHref('');
  }, []);

  const openLinkPopover = useCallback(() => {
    if (!editor) {
      return;
    }

    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').run();

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      const attrs = editor.getAttributes('link');

      linkSelectionRef.current = { from, to };
      setLinkUrl(attrs.href || '');
      setLinkText(selectedText || '');
      setActiveLinkHref('');
      setIsLinkTooltipOpen(false);
      setIsLinkPopoverOpen(true);
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    linkSelectionRef.current = { from, to };

    if (isUrlLikeSelection(selectedText)) {
      setLinkUrl(selectedText.trim());
      setLinkText('');
    } else {
      setLinkUrl('');
      setLinkText(selectedText || '');
    }

    setActiveLinkHref('');
    setIsLinkTooltipOpen(false);
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const applyLink = useCallback(
    (event) => {
      event.preventDefault();

      if (!editor) {
        return;
      }

      const selection = linkSelectionRef.current ?? {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      };
      const normalizedLinkUrl = normalizeUrl(linkUrl);
      const selectionText = editor.state.doc.textBetween(
        selection.from,
        selection.to,
        ' ',
      );
      const nextLinkText = linkText.trim();
      const currentSelectionText = editor.state.doc.textBetween(
        selection.from,
        selection.to,
        ' ',
      );

      if (!normalizedLinkUrl) {
        editor
          .chain()
          .focus()
          .setTextSelection(selection)
          .extendMarkRange('link')
          .unsetLink()
          .run();
      } else if (nextLinkText && nextLinkText !== currentSelectionText) {
        editor
          .chain()
          .focus()
          .insertContentAt(selection, {
            type: 'text',
            text: nextLinkText,
            marks: [{ type: 'link', attrs: { href: normalizedLinkUrl } }],
          })
          .setTextSelection(selection.from + nextLinkText.length)
          .run();
      } else if (selectionText) {
        editor
          .chain()
          .focus()
          .setTextSelection(selection)
          .extendMarkRange('link')
          .setLink({ href: normalizedLinkUrl })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContentAt(selection.from, {
            type: 'text',
            text: normalizedLinkUrl,
            marks: [{ type: 'link', attrs: { href: normalizedLinkUrl } }],
          })
          .setTextSelection(selection.from + normalizedLinkUrl.length)
          .run();
      }

      setLinkUrl('');
      setLinkText('');
      setIsLinkPopoverOpen(false);
      setActiveLinkHref('');
    },
    [editor, linkText, linkUrl],
  );

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

  const handleImageUpload = useCallback(
    async (event) => {
      const [file] = event.target.files ?? [];

      event.target.value = '';

      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        setImageError('Please choose an image file.');
        return;
      }

      try {
        setImageError('');
        await insertImageFiles(editor, [file]);
      } catch (error) {
        setImageError(
          error instanceof Error ? error.message : 'Unable to upload image.',
        );
      }
    },
    [editor],
  );

  const handleLinkMouseOver = useCallback(
    (event) => {
      if (!editor || isReadOnly || isLinkPopoverOpen) {
        return;
      }

      try {
        const pos = editor.view.posAtDOM(event.target, 0);
        const { state } = editor.view;
        const resolvedPos = state.doc.resolve(pos);
        const linkMark = resolvedPos
          .marks()
          .find((mark) => mark.type.name === 'link');

        if (linkMark) {
          setActiveLinkHref(linkMark.attrs.href);
          setIsLinkTooltipOpen(true);
        }
      } catch {
        setIsLinkTooltipOpen(false);
      }
    },
    [editor, isReadOnly, isLinkPopoverOpen],
  );

  const handleLinkMouseOut = useCallback(
    (event) => {
      if (!editor || isReadOnly || isLinkPopoverOpen) {
        return;
      }

      const relatedTarget = event.relatedTarget;

      if (
        linkTooltipRef.current?.contains(relatedTarget) ||
        linkPopoverRef.current?.contains(relatedTarget)
      ) {
        return;
      }

      setIsLinkTooltipOpen(false);
      setActiveLinkHref('');
    },
    [editor, isReadOnly, isLinkPopoverOpen],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex w-full animate-fade-in flex-col gap-6 pb-32 sm:gap-8">
      <input
        type="text"
        value={titleDraft}
        readOnly={isReadOnly}
        aria-label="Note Title"
        onChange={(event) => {
          const nextTitle = event.target.value;
          setTitleDraft(nextTitle);
          scheduleTitleSave(nextTitle);
        }}
        onBlur={flushTitleSave}
        placeholder={isReadOnly ? 'Untitled note' : 'Note title'}
        className={`note-print-title w-full rounded-2xl border-0 bg-transparent p-0 text-4xl font-semibold tracking-tight text-ink placeholder-muted/50 transition-colors focus:outline-none sm:text-5xl ${
          isReadOnly ? 'cursor-default' : ''
        }`}
      />

      <NoteTagsInput note={note} isReadOnly={isReadOnly} />

      {imageError ? (
        <div className="bg-red-500/8 rounded-xl border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {imageError}
        </div>
      ) : null}

      {isReadOnly ? (
        <div className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          This note is in Trash. Restore it to edit again. Delete it forever
          only if you are sure you no longer need it.
        </div>
      ) : (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload Image"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="relative">
            <EditorToolbar
              editor={editor}
              onOpenLink={openLinkPopover}
              onAddImage={() => imageInputRef.current?.click()}
              isLinkMenuActive={isLinkPopoverOpen}
              linkButtonRef={linkButtonRef}
            />
            {isLinkPopoverOpen ? (
              <LinkPopover
                linkPopoverRef={linkPopoverRef}
                linkInputRef={linkInputRef}
                linkText={linkText}
                linkUrl={linkUrl}
                onLinkTextChange={setLinkText}
                onLinkUrlChange={setLinkUrl}
                onClose={closeLinkPopover}
                onRemove={removeLink}
                onSubmit={applyLink}
              />
            ) : null}
            {isLinkTooltipOpen && activeLinkHref ? (
              <LinkTooltip
                linkTooltipRef={linkTooltipRef}
                href={activeLinkHref}
                onEdit={openLinkPopover}
                onRemove={removeLink}
                onClose={closeLinkTooltip}
              />
            ) : null}
          </div>
        </>
      )}

      <div
        className="note-print-content min-h-[50vh] flex-1 rounded-2xl text-ink/90"
        onMouseOver={handleLinkMouseOver}
        onMouseOut={handleLinkMouseOut}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default NoteEditor;
