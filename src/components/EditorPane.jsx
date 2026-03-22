import { useMemo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import NoteEditor from './NoteEditor';

function EditorPane({ totalNotes, searchQuery }) {
  const notes = useNotesStore((state) => state.notes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const note = useMemo(
    () => notes.find((entry) => entry.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  if (!note) {
    return <EmptyEditorState totalNotes={totalNotes} searchQuery={searchQuery} />;
  }

  return (
    <main className="flex min-h-[55vh] flex-1 flex-col bg-canvas">
      <EditorHeader note={note} />
      <NoteEditor note={note} />
    </main>
  );
}

export default EditorPane;
