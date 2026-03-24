import { createFileSystemStorage } from './fileSystemHelpers';
import { clearStoredFolderHandle, getStoredFolderHandle, setStoredFolderHandle } from './folderHandleDb';

function createFolderStorage(handle) {
  return createFileSystemStorage({
    kind: 'folder',
    supportsUserVisibleFolder: true,
    getRootHandle: async () => handle,
  });
}

async function canUseFolderHandle(handle) {
  if (!handle) {
    return false;
  }

  if (typeof handle.queryPermission !== 'function') {
    return true;
  }

  const permission = await handle.queryPermission({ mode: 'readwrite' });
  return permission === 'granted';
}

export async function restoreFolderStorage() {
  const handle = await getStoredFolderHandle();

  if (!(await canUseFolderHandle(handle))) {
    return null;
  }

  return createFolderStorage(handle);
}

export async function pickFolderStorage() {
  if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
    throw new Error('This browser does not support choosing a notes folder.');
  }

  const handle = await window.showDirectoryPicker({ id: 'plain-notes-folder', mode: 'readwrite' });

  if (typeof handle.requestPermission === 'function') {
    const permission = await handle.requestPermission({ mode: 'readwrite' });

    if (permission !== 'granted') {
      throw new Error('Folder permission was not granted.');
    }
  }

  await setStoredFolderHandle(handle);
  return createFolderStorage(handle);
}

export async function forgetStoredFolder() {
  await clearStoredFolderHandle();
}
