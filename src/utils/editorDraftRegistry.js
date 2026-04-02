let activeDraftRegistration = null;

export function registerActiveEditorDrafts(noteId, flushDrafts) {
  const registration = {
    noteId,
    flushDrafts,
  };

  activeDraftRegistration = registration;

  return () => {
    if (activeDraftRegistration === registration) {
      activeDraftRegistration = null;
    }
  };
}

export function flushActiveEditorDrafts(reason = 'manual') {
  activeDraftRegistration?.flushDrafts?.(reason);
}

export function getActiveEditorDraftNoteId() {
  return activeDraftRegistration?.noteId ?? null;
}
