import { create } from 'zustand';

export const useConflictStore = create((set) => ({
  activeConflict: null,

  setConflict(conflict) {
    set({ activeConflict: conflict });
  },

  clearConflict() {
    set({ activeConflict: null });
  },
}));
