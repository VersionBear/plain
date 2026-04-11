import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { getNoteTags, getTagSummary, normalizeTag } from '../utils/notes';
import { motion, AnimatePresence } from 'framer-motion';

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
        <AnimatePresence mode="popLayout">
          {tags.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="group inline-flex items-center gap-1.5 rounded-2xl bg-line/20 px-3 py-1.5 text-[13px] font-bold tracking-tight text-muted transition-all duration-300 hover:bg-line/40 hover:text-ink sm:text-[12.5px]"
            >
              <span className="opacity-40 text-accent">#</span>
              <span>{tag}</span>
              {!isReadOnly && (
                <motion.button
                  type="button"
                  onClick={() => removeTagFromNote(note.id, tag)}
                  aria-label={`Remove ${tag} tag`}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-all hover:bg-red-500/10 hover:text-red-500 md:ml-0.5"
                >
                  <X size={13} strokeWidth={3} />
                </motion.button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {!isReadOnly ? (
          <AnimatePresence mode="wait">
            {!isInputVisible && !draftTag ? (
              <motion.button
                key="add-tag-btn"
                type="button"
                onClick={() => setIsInputVisible(true)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group inline-flex items-center gap-1 rounded-xl border border-line/40 bg-line/10 py-1 pl-2 pr-2.5 text-[13px] font-medium text-muted/80 transition-all hover:border-line/60 hover:bg-line/20 hover:text-ink sm:text-[12px]"
              >
                <Plus size={14} className="text-muted/80 transition-opacity group-hover:opacity-100" />
                <span>Add Tag</span>
              </motion.button>
            ) : (
              <motion.form
                key="tag-input-form"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={(event) => {
                  event.preventDefault();
                  addTag(draftTag);
                }}
                className="inline-flex min-w-[100px] flex-1 items-center"
              >
                <motion.input
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
                  placeholder="Type and press Enter..."
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full rounded-xl border-0 bg-line/10 px-2.5 py-1 text-[13px] text-ink outline-none placeholder:text-muted/40 sm:text-[12px]"
                />
              </motion.form>
            )}
          </AnimatePresence>
        ) : null}
      </div>

      <AnimatePresence>
        {!isReadOnly && isInputVisible && suggestedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-10 mt-1 flex flex-col gap-0.5 rounded-xl border border-line/40 bg-panel/95 p-1 shadow-floating backdrop-blur-xl"
          >
            {suggestedTags.map((tag, index) => (
              <motion.button
                key={tag}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  addTag(tag);
                  inputRef.current?.focus();
                }}
                className="inline-flex w-full items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-medium text-muted/80 transition-all duration-200 hover:bg-line/25 hover:text-ink sm:text-[12px]"
              >
                <span className="opacity-60">#</span>
                <span>{tag}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NoteTagsInput;
