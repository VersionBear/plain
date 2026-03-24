import { useMemo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import NoteEditor from './NoteEditor';

function EditorPane({ totalNotes, searchQuery, isSidebarCollapsed, onToggleSidebar, activeSection }) {
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
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <EditorHeader
        note={note}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        activeSection={activeSection}
      />
      <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
    </main>
  );
}

export default EditorPane;
