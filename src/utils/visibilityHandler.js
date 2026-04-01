/**
 * Handles page visibility and lifecycle events for PWA state persistence
 * This ensures notes are saved when the app is backgrounded on mobile
 */

import { useNotesStore } from '../store/useNotesStore';

let visibilityHandler = null;
let pageHideHandler = null;
let beforeUnloadHandler = null;

/**
 * Saves the current state to storage when the page is hidden or about to unload
 * This is critical for mobile PWAs where the app can be backgrounded at any time
 */
async function saveStateOnBackground() {
  const state = useNotesStore.getState();
  
  // Only save if we have a selected note and the adapter exists
  if (!state.selectedNoteId || !state.isHydrated) {
    return;
  }

  // Trigger a save by updating the note with its current content
  // The store's mutation system will handle persistence
  const selectedNote = state.notes.find(n => n.id === state.selectedNoteId);
  
  if (selectedNote) {
    // Force a save by triggering an update with the same content
    // This ensures any pending changes are persisted
    useNotesStore.getState().updateNote(state.selectedNoteId, {
      title: selectedNote.title,
      content: selectedNote.content,
      tags: selectedNote.tags,
      pinned: selectedNote.pinned,
    }, { skipSaveCheck: true });
  }
}

/**
 * Sets up visibility change listeners to save state when the app is backgrounded
 * Should be called once during app initialization
 */
export function setupVisibilityHandlers() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  // Clean up any existing handlers
  removeVisibilityHandlers();

  // Handle visibility change (when app is backgrounded/foregrounded)
  visibilityHandler = async () => {
    if (document.visibilityState === 'hidden') {
      // App is being backgrounded - save state immediately
      await saveStateOnBackground();
    }
  };

  // Handle page hide (more reliable on mobile)
  pageHideHandler = async () => {
    await saveStateOnBackground();
  };

  // Handle before unload (desktop browsers)
  beforeUnloadHandler = async (_event) => {
    await saveStateOnBackground();
  };

  document.addEventListener('visibilitychange', visibilityHandler);
  window.addEventListener('pagehide', pageHideHandler);
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Removes all visibility and lifecycle handlers
 * Should be called during cleanup if needed
 */
export function removeVisibilityHandlers() {
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }

  if (typeof window !== 'undefined') {
    if (pageHideHandler) {
      window.removeEventListener('pagehide', pageHideHandler);
      pageHideHandler = null;
    }

    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  }
}

/**
 * Handles folder permission loss detection
 * Mobile browsers may revoke file system permissions when the app is backgrounded
 */
export async function checkFolderPermissionStatus() {
  if (typeof window === 'undefined') {
    return { hasPermission: false, needsReconnect: false };
  }

  try {
    const { getStoredFolderHandle } = await import('../storage/folderHandleDb.js');
    const handle = await getStoredFolderHandle();

    if (!handle) {
      return { hasPermission: false, needsReconnect: false };
    }

    if (typeof handle.queryPermission !== 'function') {
      return { hasPermission: true, needsReconnect: false };
    }

    const permission = await handle.queryPermission({ mode: 'readwrite' });
    const hasPermission = permission === 'granted';
    const needsReconnect = !hasPermission;

    return { hasPermission, needsReconnect };
  } catch {
    return { hasPermission: false, needsReconnect: true };
  }
}
