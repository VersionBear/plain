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

function noteFileName(noteId, extension = '.md') {
  return `${noteId}${extension}`;
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

async function readNotesFromDirectory(directoryHandle, options = {}) {
  const notes = [];

  for await (const entry of directoryHandle.values()) {
    if (
      entry.kind !== 'file' ||
      (!entry.name.endsWith('.md') && !entry.name.endsWith('.json'))
    ) {
      continue;
    }

    const file = await entry.getFile();
    const text = await file.text();
    try {
      const parsed = entry.name.endsWith('.json')
        ? safeJsonParse(text, null, { fileName: entry.name })
        : parseMarkdownToNote(text, {
            fileName: entry.name,
            lastModified: file.lastModified,
          });
      const normalized = normalizeNote(parsed, options);

      if (normalized) {
        notes.push(normalized);
      } else {
        logStorageWarning('Skipping invalid note file.', {
          fileName: entry.name,
        });
      }
    } catch (error) {
      logStorageWarning('Skipping unreadable note file.', {
        fileName: entry.name,
        error,
      });
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

    // Save as .md
    const fileName = noteFileName(normalizedNote.id, '.md');
    // Also look for old .json files to delete if they exist
    const legacyFileName = noteFileName(normalizedNote.id, '.json');

    await writeTextFile(
      destinationDir,
      fileName,
      serializeNoteToMarkdown(normalizedNote),
    );

    // Delete from alternate dir (for both extensions to be safe)
    await deleteFile(alternateDir, fileName);
    await deleteFile(alternateDir, legacyFileName);

    // Clean up legacy file in destination dir if it exists
    await deleteFile(destinationDir, legacyFileName);

    return normalizedNote;
  };

  return {
    kind,
    supportsUserVisibleFolder,
    async loadLibrary() {
      const rootHandle = await ensureRootHandle();
      const { notesDir, trashDir } = await ensureLibraryDirectories(rootHandle);
      const [index, notes, trashedNotes] = await Promise.all([
        readJsonFile(rootHandle, INDEX_FILE_NAME, createEmptyIndex()),
        readNotesFromDirectory(notesDir, { trashed: false }),
        readNotesFromDirectory(trashDir, { trashed: true }),
      ]);

      return normalizeLibrary({ index, notes, trashedNotes });
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
        await deleteFile(trashDir, noteFileName(noteId, '.md'));
        await deleteFile(trashDir, noteFileName(noteId, '.json'));
      });
    },
    saveIndex(index) {
      return runExclusive(async (rootHandle) => {
        const serializedIndex = serializeIndex(index);
        await writeTextFile(
          rootHandle,
          INDEX_FILE_NAME,
          `${JSON.stringify(serializedIndex, null, 2)}\n`,
        );
        return serializedIndex;
      });
    },
  };
}
