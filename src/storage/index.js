import { restoreFolderStorage, pickFolderStorage } from './folderStorage';
import { createLegacyLocalStorageStorage } from './legacyLocalStorage';
import { createOpfsStorage, supportsOpfsStorage } from './opfsStorage';

export function getStorageCapabilities() {
  return {
    supportsFolderPicker:
      typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function',
    supportsOpfs: supportsOpfsStorage(),
  };
}

export async function getInitialStorageAdapter() {
  const capabilities = getStorageCapabilities();

  if (capabilities.supportsFolderPicker) {
    const restoredFolderStorage = await restoreFolderStorage().catch(() => null);

    if (restoredFolderStorage) {
      return restoredFolderStorage;
    }
  }

  if (capabilities.supportsOpfs) {
    return createOpfsStorage();
  }

  return createLegacyLocalStorageStorage();
}

export async function connectFolderStorage() {
  return pickFolderStorage();
}
