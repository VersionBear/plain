import { useMemo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import NoteEditor from './NoteEditor';

function EditorPane({ totalNotes, searchQuery, isSidebarCollapsed, onToggleSidebar }) {
  const notes = useNotesStore((state) => state.notes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const note = useMemo(
    () => notes.find((entry) => entry.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  if (!note) {
    return (
      <EmptyEditorState
        totalNotes={totalNotes}
        searchQuery={searchQuery}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <EditorHeader
        note={note}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />
      <NoteEditor note={note} />
    </main>
  );
}

export default EditorPane;
