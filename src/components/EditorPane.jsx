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
    <main className="flex-1 flex flex-col min-w-0 bg-canvas relative">
      <EditorHeader
        note={note}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        activeSection={activeSection}
      />
      <div className="flex-1 overflow-y-auto w-full flex justify-center">
        <div className="w-full max-w-3xl px-6 sm:px-12 py-10 lg:py-16">
          <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
        </div>
      </div>
    </main>
  );
}

export default EditorPane;