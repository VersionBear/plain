import { useMemo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import NoteEditor from './NoteEditor';

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
  const currentNotes = activeSection === 'trash' ? trashedNotes : notes;
  const note = useMemo(
    () => currentNotes.find((entry) => entry.id === selectedNoteId) ?? null,
    [currentNotes, selectedNoteId],
  );

  if (!note) {
    return (
      <EmptyEditorState
        totalNotes={totalNotes}
        searchQuery={searchQuery}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        activeSection={activeSection}
      />
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
      <div className="note-print-shell flex w-full flex-1 justify-center overflow-y-auto">
        <div className="note-print-frame w-full max-w-3xl px-6 py-8 sm:px-12 sm:py-12 lg:py-20">
          <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
        </div>
      </div>
    </main>
  );
}

export default EditorPane;
