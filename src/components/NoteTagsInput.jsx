import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { getNoteTags, getTagSummary, normalizeTag } from '../utils/notes';

function NoteTagsInput({ note, isReadOnly = false }) {
  const notes = useNotesStore((state) => state.notes);
  const addTagToNote = useNotesStore((state) => state.addTagToNote);
  const removeTagFromNote = useNotesStore((state) => state.removeTagFromNote);
  const [draftTag, setDraftTag] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const tags = useMemo(() => getNoteTags(note), [note]);
  const normalizedDraft = normalizeTag(draftTag);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const suggestedTags = useMemo(() => {
    if (!normalizedDraft) {
      return [];
    }

    return getTagSummary(notes)
      .map(({ tag }) => tag)
      .filter((tag) => !tags.includes(tag))
      .filter(
        (tag) =>
          tag.startsWith(normalizedDraft) || tag.includes(normalizedDraft),
      )
      .slice(0, 4);
  }, [normalizedDraft, notes, tags]);

  useEffect(() => {
    setDraftTag('');
    setIsInputVisible(false);
  }, [note.id]);

  useEffect(() => {
    if (!isInputVisible) {
      return;
    }

    inputRef.current?.focus();
  }, [isInputVisible]);

  const addTag = (value) => {
    const nextTag = normalizeTag(value);

    if (!nextTag || tags.includes(nextTag)) {
      return;
    }

    addTagToNote(note.id, nextTag);
    setDraftTag('');
  };

  const collapseInput = () => {
    if (draftTag.trim()) {
      return;
    }

    setIsInputVisible(false);
  };

  if (isReadOnly && tags.length === 0) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col gap-2"
      onBlur={(event) => {
        if (wrapperRef.current?.contains(event.relatedTarget)) {
          return;
        }

        collapseInput();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1 rounded-md bg-line/20 py-1 pl-2 pr-1 text-[15px] font-medium text-muted transition-colors hover:bg-line/40 hover:text-ink sm:text-sm"
          >
            <span className="opacity-50">#</span>
            <span>{tag}</span>
            {!isReadOnly ? (
              <button
                type="button"
                onClick={() => removeTagFromNote(note.id, tag)}
                aria-label={`Remove ${tag} tag`}
                className="ml-0.5 rounded-sm p-0.5 opacity-0 transition-all hover:bg-line/50 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            ) : (
              <span className="pr-1" />
            )}
          </span>
        ))}

        {!isReadOnly ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addTag(draftTag);
            }}
            className="inline-flex min-w-[100px] flex-1 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              aria-label="Add tag"
              value={draftTag}
              onFocus={() => setIsInputVisible(true)}
              onChange={(event) => setDraftTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  addTag(draftTag);
                  return;
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  setDraftTag('');
                  setIsInputVisible(false);
                  inputRef.current?.blur();
                  return;
                }

                if (event.key === 'Backspace' && !draftTag && tags.length > 0) {
                  removeTagFromNote(note.id, tags[tags.length - 1]);
                }
              }}
              placeholder="Add tag..."
              className="w-full border-0 bg-transparent px-1 py-1 text-lg text-ink outline-none transition-all placeholder:text-muted/50 focus:placeholder:text-muted/30 sm:text-sm"
            />
          </form>
        ) : null}
      </div>

      {!isReadOnly && isInputVisible && suggestedTags.length > 0 ? (
        <div className="absolute left-0 top-full z-10 mt-1 flex animate-fade-in flex-col gap-0.5 rounded-lg border border-line/50 bg-panel p-1 shadow-lg">
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                addTag(tag);
                inputRef.current?.focus();
              }}
              className="inline-flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-[15px] font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink sm:text-sm"
            >
              <span className="opacity-50">#</span>
              <span>{tag}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default NoteTagsInput;
