import {
  hasStoredFolderStorage,
  pickFolderStorage,
  restoreFolderStorage,
} from './folderStorage';
import { createLegacyLocalStorageStorage } from './legacyLocalStorage';
import { createOpfsStorage, supportsOpfsStorage } from './opfsStorage';
import { getFileSystemAccessSupport } from '../utils/platform';

export function getStorageCapabilities() {
  const fsSupport = getFileSystemAccessSupport();

  return {
    supportsFolderPicker: fsSupport.shouldShowFolderPicker,
    supportsOpfs: supportsOpfsStorage(),
    isMobile: fsSupport.isMobile,
    isIOS: fsSupport.isIOS,
    isPWA: fsSupport.isPWA,
    folderStorageWarning: fsSupport.shouldShowWarning
      ? getFileSystemAccessSupport().isIOS
        ? 'Folder storage is not available on iOS'
        : 'Folder connections can be less reliable on mobile devices'
      : null,
  };
}

export async function getInitialStorageAdapter() {
  const capabilities = getStorageCapabilities();

  if (capabilities.supportsFolderPicker) {
    const restoredFolderStorage = await restoreFolderStorage().catch(
      () => null,
    );

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

export async function hasStoredFolderConnection() {
  return hasStoredFolderStorage();
}
