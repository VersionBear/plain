import { useEffect, useRef } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { getPlainTextFromContent } from '../utils/notes';

const toolbarActions = [
  { label: 'P', title: 'Paragraph', command: 'formatBlock', value: 'p' },
  { label: 'H1', title: 'Large heading', command: 'formatBlock', value: 'h1' },
  { label: 'H2', title: 'Section heading', command: 'formatBlock', value: 'h2' },
  { label: 'B', title: 'Bold', command: 'bold' },
  { label: 'I', title: 'Italic', command: 'italic' },
  { label: 'U', title: 'Underline', command: 'underline' },
  { label: 'Quote', title: 'Blockquote', command: 'formatBlock', value: 'blockquote' },
  { label: 'List', title: 'Bullet list', command: 'insertUnorderedList' },
  { label: '1.', title: 'Numbered list', command: 'insertOrderedList' },
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function NoteEditor({ note }) {
  const updateNote = useNotesStore((state) => state.updateNote);
  const editorRef = useRef(null);
  const lastSyncedContentRef = useRef('');

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
  }, [note.id, note.content]);

  const commitEditorState = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const nextContent = editor.innerHTML === '<br>' ? '' : editor.innerHTML;

    if (nextContent === lastSyncedContentRef.current) {
      return;
    }

    lastSyncedContentRef.current = nextContent;
    updateNote(note.id, { content: nextContent });
  };

  const runCommand = (command, value = null) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(command, false, value);
    commitEditorState();
  };

  return (
    <section className="flex flex-1 flex-col px-5 py-7 md:px-8 md:py-9">
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 flex-col">
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
              key={action.label}
              type="button"
              title={action.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(action.command, action.value)}
              className="shrink-0 rounded-full border border-line/80 bg-elevated/85 px-3 py-2 text-sm text-muted transition hover:border-line hover:bg-panel hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex min-h-[360px] flex-1 flex-col rounded-[28px] border border-line/75 bg-elevated/80 shadow-panel md:min-h-[520px]">
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
            onBlur={commitEditorState}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
              commitEditorState();
            }}
            className="editor-surface min-h-[300px] flex-1 overflow-y-auto border-0 bg-transparent px-4 py-4 text-[15px] leading-8 text-ink focus:outline-none md:text-base"
          />
        </div>
      </div>
    </section>
  );
}

export default NoteEditor;
