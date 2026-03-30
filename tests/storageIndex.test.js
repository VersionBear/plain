import { beforeEach, describe, expect, it, vi } from 'vitest';

const restoreFolderStorage = vi.fn();
const hasStoredFolderStorage = vi.fn();
const pickFolderStorage = vi.fn();
const createLegacyLocalStorageStorage = vi.fn(() => ({ kind: 'legacy' }));
const createOpfsStorage = vi.fn(() => ({ kind: 'opfs' }));
const supportsOpfsStorage = vi.fn();

vi.mock('../src/storage/folderStorage', () => ({
  restoreFolderStorage,
  hasStoredFolderStorage,
  pickFolderStorage,
}));

vi.mock('../src/storage/legacyLocalStorage', () => ({
  createLegacyLocalStorageStorage,
}));

vi.mock('../src/storage/opfsStorage', () => ({
  createOpfsStorage,
  supportsOpfsStorage,
}));

describe('storage adapter selection', () => {
  beforeEach(() => {
    restoreFolderStorage.mockReset();
    hasStoredFolderStorage.mockReset();
    pickFolderStorage.mockReset();
    createLegacyLocalStorageStorage.mockClear();
    createOpfsStorage.mockClear();
    supportsOpfsStorage.mockReset();
    supportsOpfsStorage.mockReturnValue(false);
    restoreFolderStorage.mockResolvedValue(null);
    delete window.showDirectoryPicker;
  });

  it('restores a previously connected folder before falling back', async () => {
    const folderAdapter = { kind: 'folder' };
    window.showDirectoryPicker = vi.fn();
    restoreFolderStorage.mockResolvedValue(folderAdapter);

    const { getInitialStorageAdapter } = await import('../src/storage/index');
    const adapter = await getInitialStorageAdapter();

    expect(restoreFolderStorage).toHaveBeenCalledTimes(1);
    expect(createOpfsStorage).not.toHaveBeenCalled();
    expect(createLegacyLocalStorageStorage).not.toHaveBeenCalled();
    expect(adapter).toBe(folderAdapter);
  });

  it('falls back to OPFS when no stored folder can be restored', async () => {
    const opfsAdapter = { kind: 'opfs' };
    window.showDirectoryPicker = vi.fn();
    supportsOpfsStorage.mockReturnValue(true);
    createOpfsStorage.mockReturnValue(opfsAdapter);

    const { getInitialStorageAdapter } = await import('../src/storage/index');
    const adapter = await getInitialStorageAdapter();

    expect(restoreFolderStorage).toHaveBeenCalledTimes(1);
    expect(createOpfsStorage).toHaveBeenCalledTimes(1);
    expect(adapter).toBe(opfsAdapter);
  });
});
