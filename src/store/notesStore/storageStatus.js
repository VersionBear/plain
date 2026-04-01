export function getStorageLabel(adapter, capabilities, hasStoredFolderHandle) {
  if (!adapter) {
    return 'Loading storage';
  }

  if (adapter.kind === 'folder') {
    return 'Stored in folder';
  }

  if (capabilities.supportsFolderPicker && hasStoredFolderHandle) {
    return 'Folder available';
  }

  return capabilities.supportsFolderPicker
    ? 'Folder not connected'
    : 'Stored in browser';
}

export function getStorageDescription(
  adapter,
  capabilities,
  hasStoredFolderHandle,
) {
  if (!adapter) {
    return 'Opening your notes.';
  }

  if (adapter.kind === 'folder') {
    return 'Notes save into the folder you chose, with deleted notes moved to Trash.';
  }

  if (adapter.kind === 'opfs') {
    if (capabilities.supportsFolderPicker && hasStoredFolderHandle) {
      return 'Reconnect your saved notes folder when you want to work with markdown files on disk.';
    }

    return capabilities.supportsFolderPicker
      ? 'Notes are safe in browser storage until you connect a real folder.'
      : 'Notes are stored in browser-managed device storage.';
  }

  return 'Notes are stored in local browser storage on this device.';
}

export function buildStorageStatus(
  adapter,
  capabilities,
  pendingImportCount,
  overrides = {},
) {
  const hasStoredFolderHandle = Boolean(overrides.hasStoredFolderHandle);

  return {
    kind: adapter?.kind ?? 'unknown',
    label: getStorageLabel(adapter, capabilities, hasStoredFolderHandle),
    detail: getStorageDescription(adapter, capabilities, hasStoredFolderHandle),
    supportsFolderPicker: capabilities.supportsFolderPicker,
    hasFolderConnection: adapter?.kind === 'folder',
    hasStoredFolderHandle,
    isHydrating: false,
    isConnectingFolder: false,
    lastError: '',
    pendingImportCount,
    isMobile: capabilities.isMobile ?? false,
    isIOS: capabilities.isIOS ?? false,
    folderStorageWarning: capabilities.folderStorageWarning ?? null,
    ...overrides,
  };
}

export function setSyncError(set, error) {
  const message =
    error instanceof Error
      ? error.message
      : 'Something went wrong while saving your notes.';

  set((state) => ({
    storageStatus: {
      ...state.storageStatus,
      lastError: message,
    },
  }));
}

export function clearSyncError(set) {
  set((state) => {
    if (!state.storageStatus.lastError) {
      return state;
    }

    return {
      storageStatus: {
        ...state.storageStatus,
        lastError: '',
      },
    };
  });
}
