/**
 * Handles page visibility and lifecycle events for PWA state persistence.
 * The active editor registers a flush callback so we can persist any in-flight
 * draft changes before the app is backgrounded or unloaded.
 */

import { flushActiveEditorDrafts } from './editorDraftRegistry';

let visibilityHandler = null;
let pageHideHandler = null;
let beforeUnloadHandler = null;

function flushEditorDraftsForLifecycle(reason) {
  flushActiveEditorDrafts(reason);
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
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      flushEditorDraftsForLifecycle('visibilitychange');
    }
  };

  // Handle page hide (more reliable on mobile)
  pageHideHandler = () => {
    flushEditorDraftsForLifecycle('pagehide');
  };

  // Handle before unload (desktop browsers)
  beforeUnloadHandler = () => {
    flushEditorDraftsForLifecycle('beforeunload');
  };

  document.addEventListener('visibilitychange', visibilityHandler);
  window.addEventListener('pagehide', pageHideHandler);
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

export { flushEditorDraftsForLifecycle };

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
