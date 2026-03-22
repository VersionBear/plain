import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getNextSelectedNoteId, makeEmptyNote, sortNotes } from '../utils/notes';

const storageKey = 'plain-notes';

export const useNotesStore = create()(
  persist(
    (set) => ({
      notes: [],
      selectedNoteId: null,
      searchQuery: '',
      createNote: () => {
        const note = makeEmptyNote();

        set((state) => ({
          notes: sortNotes([note, ...state.notes]),
          selectedNoteId: note.id,
        }));
      },
      updateNote: (noteId, updates) => {
        set((state) => {
          const note = state.notes.find((entry) => entry.id === noteId);

          if (!note) {
            return state;
          }

          const nextTitle = updates.title ?? note.title;
          const nextContent = updates.content ?? note.content;
          const titleChanged = nextTitle !== note.title;
          const contentChanged = nextContent !== note.content;

          if (!titleChanged && !contentChanged) {
            return state;
          }

          const updatedNote = {
            ...note,
            ...updates,
            updatedAt: Date.now(),
          };

          return {
            notes: sortNotes(
              state.notes.map((entry) => (entry.id === noteId ? updatedNote : entry)),
            ),
          };
        });
      },
      deleteNote: (noteId) => {
        set((state) => {
          const remainingNotes = state.notes.filter((note) => note.id !== noteId);
          const selectedNoteId =
            state.selectedNoteId === noteId
              ? getNextSelectedNoteId(remainingNotes, state.searchQuery)
              : state.selectedNoteId;

          return {
            notes: remainingNotes,
            selectedNoteId,
          };
        });
      },
      togglePinned: (noteId) => {
        set((state) => ({
          notes: sortNotes(
            state.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    pinned: !note.pinned,
                    updatedAt: Date.now(),
                  }
                : note,
            ),
          ),
        }));
      },
      selectNote: (noteId) => set({ selectedNoteId: noteId }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: storageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        selectedNoteId: state.selectedNoteId,
      }),
    },
  ),
);
