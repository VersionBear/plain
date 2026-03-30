import { createFileSystemStorage } from './fileSystemHelpers';

let plainRootDirectoryPromise = null;

export function supportsOpfsStorage() {
  return (
    typeof navigator !== 'undefined' && Boolean(navigator.storage?.getDirectory)
  );
}

async function getPlainRootDirectory() {
  if (!supportsOpfsStorage()) {
    throw new Error('Persistent browser file storage is not available here.');
  }

  if (!plainRootDirectoryPromise) {
    plainRootDirectoryPromise = navigator.storage
      .getDirectory()
      .then((rootHandle) =>
        rootHandle.getDirectoryHandle('plain-data', { create: true }),
      );
  }

  return plainRootDirectoryPromise;
}

export function createOpfsStorage() {
  return createFileSystemStorage({
    kind: 'opfs',
    supportsUserVisibleFolder: false,
    getRootHandle: getPlainRootDirectory,
  });
}
