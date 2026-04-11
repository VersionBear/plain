import { INDEX_FILE_NAME, NOTES_DIR_NAME, TRASH_DIR_NAME } from './constants';
import {
  createEmptyIndex,
  normalizeLibrary,
  normalizeNote,
  serializeIndex,
} from './types';
import {
  parseMarkdownToNote,
  serializeNoteToMarkdown,
} from '../utils/noteMarkdown';
import {
  extractImageAssets,
  resolveImageAssets,
  saveImageAssets,
  ensureAssetsDir,
} from './imageAssets';

function logStorageWarning(message, context = {}) {
  console.warn(`[plain-storage] ${message}`, context);
}

function safeJsonParse(text, fallbackValue, context) {
  try {
    return JSON.parse(text);
  } catch (error) {
    logStorageWarning(
      'Unable to parse JSON file. Falling back to safe default.',
      {
        ...context,
        error,
      },
    );
    return fallbackValue;
  }
}



async function ensureLibraryDirectories(rootHandle) {
  const notesDir = await rootHandle.getDirectoryHandle(NOTES_DIR_NAME, {
    create: true,
  });
  const trashDir = await rootHandle.getDirectoryHandle(TRASH_DIR_NAME, {
    create: true,
  });

  return { notesDir, trashDir };
}

async function getNoteAssetsDir(directoryHandle) {
  return ensureAssetsDir(directoryHandle);
}

async function readTextFile(parentHandle, fileName) {
  try {
    const fileHandle = await parentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }

    throw error;
  }
}

async function readJsonFile(parentHandle, fileName, fallbackValue) {
  const text = await readTextFile(parentHandle, fileName);

  if (!text) {
    return fallbackValue;
  }

  return safeJsonParse(text, fallbackValue, { fileName });
}

async function writeTextFile(parentHandle, fileName, content) {
  const fileHandle = await parentHandle.getFileHandle(fileName, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function deleteFile(parentHandle, fileName) {
  try {
    await parentHandle.removeEntry(fileName);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return;
    }

    throw error;
  }
}

async function readNotesFromDirectory(directoryHandle, options = {}, idToStem = new Map(), indexMetadata = {}) {
  const notes = [];
  const assetsDirHandle = await getNoteAssetsDir(directoryHandle).catch(() => null);

  for await (const entry of directoryHandle.values()) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.md')) continue;

    const stem = entry.name.slice(0, -3);

    try {
      const file = await entry.getFile();
      const mdText = await file.text();

      let parsedNote = parseMarkdownToNote(mdText, {
        fileName: entry.name,
        lastModified: file.lastModified,
      });

      // Resolve image asset paths back to data URLs
      if (assetsDirHandle && parsedNote.content) {
        parsedNote.content = await resolveImageAssets(parsedNote.content, assetsDirHandle);
      }

      let noteMetadata = {};
      let foundId = parsedNote.id;

      for (const [id, meta] of Object.entries(indexMetadata)) {
        if (meta.stem === stem) {
          foundId = id;
          noteMetadata = meta;
          break;
        }
      }

      const rawNote = {
        ...parsedNote,
        id: foundId,
        ...noteMetadata
      };

      const normalized = normalizeNote(rawNote, options);

      if (normalized) {
        notes.push(normalized);
        idToStem.set(normalized.id, stem);
      } else {
        logStorageWarning('Skipping invalid note file.', { stem });
      }
    } catch (error) {
      logStorageWarning('Skipping unreadable note pair.', { stem, error });
    }
  }

  return notes;
}

export function createFileSystemStorage({
  kind,
  supportsUserVisibleFolder,
  getRootHandle,
}) {
  let writeQueue = Promise.resolve();
  const idToStem = new Map();
  let cachedIndexData = null;

  const ensureRootHandle = async () => {
    const rootHandle = await getRootHandle();
    await ensureLibraryDirectories(rootHandle);
    return rootHandle;
  };

  const runExclusive = (operation) => {
    const nextOperation = writeQueue
      .catch(() => undefined)
      .then(async () => {
        const rootHandle = await ensureRootHandle();
        return operation(rootHandle);
      });

    writeQueue = nextOperation.catch(() => undefined);
    return nextOperation;
  };

  const writeNote = async (rootHandle, note) => {
    const normalizedNote = normalizeNote(note, {
      trashed: Boolean(note?.trashedAt),
    });

    if (!normalizedNote) {
      throw new Error('Unable to save an invalid note.');
    }

    const { notesDir, trashDir } = await ensureLibraryDirectories(rootHandle);
    const destinationDir = normalizedNote.trashedAt ? trashDir : notesDir;
    const alternateDir = normalizedNote.trashedAt ? notesDir : trashDir;

    const oldStem = idToStem.get(normalizedNote.id);
    
    let baseStem = (normalizedNote.title || 'Untitled')
      .replace(/[<>:"/\\|?*\n]/g, '-')
      .replace(/^[.\s]+|[.\s]+$/g, '')
      .trim();
      
    if (!baseStem) {
      baseStem = 'Untitled';
    }

    let nextStem = baseStem;
    const isStemInUse = (stem) => {
      for (const [id, usedStem] of idToStem.entries()) {
        if (usedStem === stem && id !== normalizedNote.id) {
          return true;
        }
      }
      return false;
    };

    let counter = 1;
    while (isStemInUse(nextStem)) {
      nextStem = `${baseStem} ${counter}`;
      counter++;
    }

    const mdFileName = `${nextStem}.md`;

    // Extract base64 images from HTML and replace with relative asset paths
    const { html: processedContent, assets } = await extractImageAssets(
      normalizedNote.content,
    );

    // Create a temporary note with processed content for serialization
    const noteForSerialization = {
      ...normalizedNote,
      content: processedContent,
    };

    // Write the markdown file (now with relative image paths instead of base64)
    await writeTextFile(
      destinationDir,
      mdFileName,
      serializeNoteToMarkdown(noteForSerialization),
    );

    // Save extracted image assets to the assets directory
    const assetsDirHandle = await getNoteAssetsDir(destinationDir);
    await saveImageAssets(assetsDirHandle, assets, Array.from(assets.keys()));

    idToStem.set(normalizedNote.id, nextStem);

    if (!cachedIndexData) {
       cachedIndexData = await readJsonFile(rootHandle, INDEX_FILE_NAME, createEmptyIndex());
    }
    if (!cachedIndexData.metadata) {
       cachedIndexData.metadata = {};
    }

    cachedIndexData.metadata[normalizedNote.id] = {
      stem: nextStem,
      title: normalizedNote.title,
      pinned: Boolean(normalizedNote.pinned),
      createdAt: normalizedNote.createdAt,
      updatedAt: normalizedNote.updatedAt,
      ...(Array.isArray(normalizedNote.tags) && normalizedNote.tags.length > 0
        ? { tags: normalizedNote.tags }
        : {}),
      ...(normalizedNote.trashedAt ? { trashedAt: normalizedNote.trashedAt } : {}),
    };

    await writeTextFile(
      rootHandle,
      INDEX_FILE_NAME,
      `${JSON.stringify(cachedIndexData, null, 2)}\n`,
    );

    // Clean up temporary json files if they existed
    await deleteFile(destinationDir, `${nextStem}.json`);

    // CRITICAL: If we moved folders or renamed, ensure no residual files exist in either directory
    if (oldStem && oldStem !== nextStem) {
      await deleteFile(destinationDir, `${oldStem}.md`);
    }
    
    if (oldStem) {
      await deleteFile(alternateDir, `${oldStem}.md`);
      await deleteFile(alternateDir, `${oldStem}.json`);
    }

    if (oldStem !== nextStem) {
      await deleteFile(alternateDir, `${nextStem}.md`);
    }

    // Always try to clean up the ID-based json if it exists
    await deleteFile(alternateDir, `${normalizedNote.id}.json`);
    await deleteFile(destinationDir, `${normalizedNote.id}.json`);

    return normalizedNote;
  };

  return {
    kind,
    supportsUserVisibleFolder,
    getRootHandle: ensureRootHandle,
    async loadLibrary() {
      const rootHandle = await ensureRootHandle();
      const { notesDir, trashDir } = await ensureLibraryDirectories(rootHandle);

      cachedIndexData = await readJsonFile(rootHandle, INDEX_FILE_NAME, createEmptyIndex());
      if (!cachedIndexData.metadata) cachedIndexData.metadata = {};

      const [notes, trashedNotes] = await Promise.all([
        readNotesFromDirectory(notesDir, { trashed: false }, idToStem, cachedIndexData.metadata),
        readNotesFromDirectory(trashDir, { trashed: true }, idToStem, cachedIndexData.metadata),
      ]);

      return normalizeLibrary({ index: cachedIndexData, notes, trashedNotes });
    },
    saveNote(note) {
      return runExclusive(async (rootHandle) => writeNote(rootHandle, note));
    },
    trashNote(note) {
      return runExclusive(async (rootHandle) =>
        writeNote(rootHandle, {
          ...note,
          trashedAt:
            typeof note?.trashedAt === 'number' &&
            Number.isFinite(note.trashedAt)
              ? note.trashedAt
              : Date.now(),
        }),
      );
    },
    restoreNote(note) {
      return runExclusive(async (rootHandle) =>
        writeNote(rootHandle, {
          ...note,
          trashedAt: null,
          updatedAt: Date.now(),
        }),
      );
    },
    deleteNotePermanently(noteId) {
      return runExclusive(async (rootHandle) => {
        const { trashDir } = await ensureLibraryDirectories(rootHandle);
        const stem = idToStem.get(noteId) || noteId;
        await deleteFile(trashDir, `${stem}.md`);
        await deleteFile(trashDir, `${stem}.json`);
        idToStem.delete(noteId);

        // Note: Full asset cleanup by stem is complex because assets aren't strictly prefixed
        // but we at least stop deleting everything in the trash assets folder.

        if (cachedIndexData && cachedIndexData.metadata && cachedIndexData.metadata[noteId]) {
          delete cachedIndexData.metadata[noteId];
          await writeTextFile(
            rootHandle,
            INDEX_FILE_NAME,
            `${JSON.stringify(cachedIndexData, null, 2)}\n`,
          );
        }
      });
    },
    saveIndex(index) {
      return runExclusive(async (rootHandle) => {
        const serializedIndex = serializeIndex(index);
        
        if (cachedIndexData) {
          cachedIndexData = { ...cachedIndexData, ...serializedIndex };
        } else {
          cachedIndexData = serializedIndex;
        }
        if (!cachedIndexData.metadata) cachedIndexData.metadata = {};

        await writeTextFile(
          rootHandle,
          INDEX_FILE_NAME,
          `${JSON.stringify(cachedIndexData, null, 2)}\n`,
        );
        return cachedIndexData;
      });
    },
  };
}
