import { useNotesStore } from '../store/useNotesStore';

function EmptyEditorState({ totalNotes, searchQuery }) {
  const createNote = useNotesStore((state) => state.createNote);

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
      <div className="max-w-xl text-center">
        <p className="font-serif text-4xl tracking-calm text-ink md:text-5xl">
          {totalNotes === 0 ? 'Open. Write. Done.' : 'A smaller place for your thoughts.'}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted">
          {totalNotes === 0
            ? 'Plain is intentionally limited. No accounts. No sync. No feature clutter. Just a calm, local-first space to write and return.'
            : searchQuery
              ? 'Your search is hiding the currently selected note. Clear the search or create something new.'
              : 'Select a note from the left or create a fresh one. Plain stays out of the way on purpose.'}
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={createNote}
            className="hairline rounded-full bg-elevated/90 px-5 py-3 text-sm font-medium text-ink transition hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Create a note
          </button>
        </div>
      </div>
    </main>
  );
}

export default EmptyEditorState;
