/**
 * Conflict detection and resolution for notes.
 * Detects when a note has been modified both in-app and externally.
 */

import { parseMarkdownToNote } from '../../utils/noteMarkdown';

/**
 * Compare two note contents and determine if they conflict.
 * Two versions conflict if they both have meaningful changes from a common ancestor.
 */
export function detectNoteConflict(appNote, diskNote) {
  if (!appNote || !diskNote) {
    return { hasConflict: false };
  }

  // Normalize content for comparison (strip whitespace differences)
  const appContent = (appNote.content || '').trim();
  const diskContent = (diskNote.content || '').trim();

  // No conflict if content is identical
  if (appContent === diskContent) {
    return { hasConflict: false };
  }

  // Determine which version is newer
  const appUpdatedAt = appNote.updatedAt || 0;
  const diskUpdatedAt = diskNote.lastModified || diskNote.updatedAt || 0;

  const diskIsNewer = diskUpdatedAt > appUpdatedAt;
  const timeDiff = Math.abs(diskUpdatedAt - appUpdatedAt);

  // If changes are very close (within 2 seconds), likely same edit session
  if (timeDiff < 2000) {
    return { hasConflict: false };
  }

  return {
    hasConflict: true,
    appNote,
    diskNote,
    diskIsNewer,
    timeDiff,
    appUpdatedAt,
    diskUpdatedAt,
  };
}

/**
 * Parse raw markdown text from disk into a note object for conflict comparison.
 */
export function parseDiskNote(mdText, fileName, lastModified) {
  return parseMarkdownToNote(mdText, {
    fileName,
    lastModified,
  });
}

/**
 * Resolve a conflict by choosing one version over the other.
 */
export function resolveConflict(choice, appNote, diskNote) {
  switch (choice) {
    case 'keep_app':
      return {
        resolvedNote: appNote,
        resolution: 'kept_app_version',
      };
    case 'keep_disk':
      return {
        resolvedNote: {
          ...diskNote,
          updatedAt: Date.now(),
        },
        resolution: 'kept_disk_version',
      };
    case 'keep_both':
      // Create a duplicate of the disk version
      {
        const duplicateId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return {
          resolvedNote: appNote, // Keep original app note
          duplicateNote: {
            ...diskNote,
            id: duplicateId,
            title: `${diskNote.title || 'Untitled'} (copy)`,
            updatedAt: Date.now(),
          },
          resolution: 'kept_both',
        };
      }
    default:
      return {
        resolvedNote: appNote,
        resolution: 'none',
      };
  }
}

/**
 * Check if content has meaningful differences (ignoring minor whitespace/formatting).
 */
export function hasMeaningfulContentChange(content1, content2) {
  if (!content1 && !content2) return false;
  if (!content1 || !content2) return true;

  // Normalize whitespace for comparison
  const normalized1 = content1.replace(/\s+/g, ' ').trim();
  const normalized2 = content2.replace(/\s+/g, ' ').trim();

  return normalized1 !== normalized2;
}
