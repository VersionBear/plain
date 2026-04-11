export function getStorageLabel(adapter, capabilities, hasStoredFolderHandle) {
  if (!adapter) {
    return 'Checking storage';
  }

  if (adapter.kind === 'folder') {
    return 'Folder storage active';
  }

  if (capabilities.supportsFolderPicker && hasStoredFolderHandle) {
    return 'Browser storage active';
  }

  return capabilities.supportsFolderPicker
    ? 'Browser storage active'
    : 'On-device browser storage';
}

export function getStorageDescription(
  adapter,
  capabilities,
  hasStoredFolderHandle,
) {
  if (!adapter) {
    return 'Checking where your notes are stored.';
  }

  if (adapter.kind === 'folder') {
    return 'Notes save as Markdown files in your chosen folder. Plain has no built-in sync or account recovery.';
  }

  if (adapter.kind === 'opfs') {
    if (capabilities.supportsFolderPicker && hasStoredFolderHandle) {
      return 'Notes are currently saving in this browser on this device. Reconnect your folder if you want Markdown files on disk again.';
    }

    return capabilities.supportsFolderPicker
      ? 'Notes are saving in this browser on this device until you connect a folder.'
      : 'Notes are saving in browser-managed storage on this device.';
  }

  return 'Notes are saving in local browser storage on this device.';
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
    isRefreshing: false,
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
      : 'Plain could not save that change.';

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
