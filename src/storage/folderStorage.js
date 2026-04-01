import { createFileSystemStorage } from './fileSystemHelpers';
import {
  clearStoredFolderHandle,
  getStoredFolderHandle,
  setStoredFolderHandle,
} from './folderHandleDb';
import { isIOS } from '../utils/platform';

function createFolderStorage(handle) {
  return createFileSystemStorage({
    kind: 'folder',
    supportsUserVisibleFolder: true,
    getRootHandle: async () => handle,
  });
}

async function canUseFolderHandle(handle, { requestPermission = false } = {}) {
  if (!handle) {
    return false;
  }

  // iOS doesn't support File System Access API at all
  if (isIOS()) {
    return false;
  }

  if (typeof handle.queryPermission !== 'function') {
    return true;
  }

  const query = await handle.queryPermission({ mode: 'readwrite' });

  if (query === 'granted') {
    return true;
  }

  if (!requestPermission || typeof handle.requestPermission !== 'function') {
    return false;
  }

  const requested = await handle.requestPermission({ mode: 'readwrite' });
  return requested === 'granted';
}

export async function restoreFolderStorage(options = {}) {
  const handle = await getStoredFolderHandle();

  if (!(await canUseFolderHandle(handle, options))) {
    return null;
  }

  return createFolderStorage(handle);
}

export async function hasStoredFolderStorage() {
  const handle = await getStoredFolderHandle().catch(() => null);
  return Boolean(handle);
}

export async function pickFolderStorage() {
  if (
    typeof window === 'undefined' ||
    typeof window.showDirectoryPicker !== 'function'
  ) {
    throw new Error('Folder storage is not supported on this device. Your notes will be stored in browser storage instead.');
  }

  // iOS doesn't support File System Access API
  if (isIOS()) {
    throw new Error('Folder storage is not available on iOS. Your notes will be stored in browser storage instead.');
  }

  const restoredStorage = await restoreFolderStorage({
    requestPermission: true,
  }).catch(() => null);

  if (restoredStorage) {
    return restoredStorage;
  }

  const handle = await window.showDirectoryPicker({
    id: 'plain-notes-folder',
    mode: 'readwrite',
  });

  if (typeof handle.requestPermission === 'function') {
    const permission = await handle.requestPermission({ mode: 'readwrite' });

    if (permission !== 'granted') {
      throw new Error('Folder permission was not granted.');
    }
  }

  await setStoredFolderHandle(handle).catch(() => undefined);
  return createFolderStorage(handle);
}

export async function forgetStoredFolder() {
  await clearStoredFolderHandle();
}
