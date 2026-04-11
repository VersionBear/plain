import { EditorContent, useEditor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteTagsInput from './NoteTagsInput';
import { getNoteEditorExtensions } from './editor/editorExtensions';
import { insertImageFiles } from './editor/imageUtils';
import TableEdgeMenu from './editor/TableEdgeMenu';
import TableBubbleMenu from './editor/TableBubbleMenu';
import MobileTableMenu from './editor/MobileTableMenu';
import FormattingBubbleMenu from './editor/FormattingBubbleMenu';
import LinkBubbleMenu from './editor/LinkBubbleMenu';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
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
  const [titleDraft, setTitleDraft] = useState(note.title || '');
  const [imageError, setImageError] = useState('');

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
      handleClick(view, pos, event) {
        const target = event.target;
        const link = target.closest('a');

        if (link && link.href) {
          const isModKey = event.metaKey || event.ctrlKey;
          
          // Always prevent default to stop the browser from navigating
          // This allows the LinkBubbleMenu to show up instead
          event.preventDefault();

          if (isModKey) {
            window.open(link.href, '_blank', 'noopener,noreferrer');
          }
          
          return true;
        }
        return false;
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

  if (!editor) {
    return null;
  }

  return (
    <div className="flex w-full animate-fade-in flex-col gap-4 pb-32 sm:gap-6 md:gap-8">
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
        className={`note-print-title w-full rounded-xl border-0 bg-transparent p-0 text-[24px] font-semibold tracking-tightest text-ink placeholder-muted/30 transition-colors focus:outline-none sm:text-[32px] md:text-[40px] ${
          isReadOnly ? 'cursor-default' : ''
        }`}
      />

      <NoteTagsInput note={note} isReadOnly={isReadOnly} />

      {imageError ? (
        <div className="rounded-2xl border border-red-500/15 bg-red-500/6 px-4 py-3 text-[13px] text-red-600 dark:text-red-300">
          {imageError}
        </div>
      ) : null}

      {isReadOnly ? (
        <div className="rounded-2xl border border-line/40 bg-panel/80 p-4 text-[13px] text-muted/70">
          This note is in Trash. Restore it to edit again. Delete it forever
          only if you are sure you no longer need it.
        </div>
      ) : (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          aria-label="Upload Image"
          className="hidden"
          onChange={handleImageUpload}
        />
      )}

      <div
        className="note-print-content min-h-[50vh] flex-1 rounded-2xl text-ink/85 relative"
      >
        <EditorContent editor={editor} />
        {!isReadOnly && (
          <>
            <FormattingBubbleMenu editor={editor} />
            <LinkBubbleMenu editor={editor} />
            <TableEdgeMenu editor={editor} />
            <TableBubbleMenu editor={editor} />
            <MobileTableMenu editor={editor} />
          </>
        )}
      </div>
    </div>
  );
}

export default NoteEditor;
