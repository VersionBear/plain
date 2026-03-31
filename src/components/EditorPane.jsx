import { useMemo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import NoteEditor from './NoteEditor';
import clsx from 'clsx';

function EditorPane({
  totalNotes,
  searchQuery,
  isSidebarCollapsed,
  onToggleSidebar,
  activeSection,
}) {
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const isWriterMode = useSettingsStore((state) => state.isWriterMode);
  const isWideMode = useSettingsStore((state) => state.isWideMode);
  const currentNotes = activeSection === 'trash' ? trashedNotes : notes;
  const note = useMemo(
    () => currentNotes.find((entry) => entry.id === selectedNoteId) ?? null,
    [currentNotes, selectedNoteId],
  );

  if (!note) {
    return (
      <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <EditorHeader
          note={null}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          activeSection={activeSection}
        />
        <EmptyEditorState
          totalNotes={totalNotes}
          searchQuery={searchQuery}
          activeSection={activeSection}
        />
      </main>
    );
  }

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
      <EditorHeader
        note={note}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        activeSection={activeSection}
      />
      <div className="note-print-shell group flex w-full flex-1 justify-center overflow-y-auto">
        <div
          className={clsx(
            'note-print-frame w-full px-6 py-8 sm:px-12 sm:py-12 lg:py-20',
            isWideMode ? 'max-w-6xl' : 'max-w-4xl',
            isWriterMode ? 'font-serif' : ''
          )}
        >
          <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
        </div>
      </div>
    </main>
  );
}

export default EditorPane;
