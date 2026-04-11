import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Pencil, Tag, Trash2, X } from 'lucide-react';
import ConfirmDialog from './common/ConfirmDialog';

function TagFilterBar({
  tags,
  activeTag,
  onTagSelect,
  onRenameTag,
  onDeleteTag,
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [draftTag, setDraftTag] = useState('');
  const [pendingDeleteTag, setPendingDeleteTag] = useState('');
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const activeTagCount = useMemo(
    () => tags.find(({ tag }) => tag === activeTag)?.count ?? 0,
    [activeTag, tags],
  );

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (pickerRef.current?.contains(event.target)) {
        return;
      }

      setIsPickerOpen(false);
      setIsManaging(false);
      setEditingTag('');
      setDraftTag('');
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (editingTag) {
          setEditingTag('');
          setDraftTag('');
          return;
        }

        setIsPickerOpen(false);
        setIsManaging(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [editingTag, isPickerOpen]);

  useEffect(() => {
    if (!editingTag) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editingTag]);

  if (tags.length === 0 && !activeTag) {
    return null;
  }

  const closePicker = () => {
    setIsPickerOpen(false);
    setIsManaging(false);
    setEditingTag('');
    setDraftTag('');
  };

  const selectTag = (tag) => {
    onTagSelect(tag);
    closePicker();
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setDraftTag(tag);
    setIsManaging(true);
  };

  const submitRename = () => {
    const trimmedTag = draftTag.trim();

    if (!editingTag || !trimmedTag || trimmedTag === editingTag) {
      setEditingTag('');
      setDraftTag('');
      return;
    }

    void onRenameTag(editingTag, trimmedTag);
    setEditingTag('');
    setDraftTag('');
  };

  const handleDelete = (tag) => {
    setPendingDeleteTag(tag);
  };

  return (
    <div ref={pickerRef} className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectTag('')}
          className={clsx(
            'inline-flex items-center rounded-2xl border px-4 py-2 text-[12px] font-bold tracking-tight transition-all',
            activeTag
              ? 'border-transparent bg-ink/5 text-muted hover:bg-ink/10 hover:text-ink'
              : 'border-accent/10 bg-accent/5 text-accent shadow-sm ring-1 ring-accent/5',
          )}
        >
          All notes
        </button>

        {activeTag ? (
          <button
            type="button"
            onClick={() => selectTag('')}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-2 text-[12px] font-bold tracking-tight text-accent shadow-sm ring-1 ring-accent/10 transition-all hover:bg-accent/10"
          >
            <span className="opacity-50">#</span>
            <span>{activeTag}</span>
            {activeTagCount > 0 ? (
              <span className="rounded-lg bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold">
                {activeTagCount}
              </span>
            ) : null}
            <X size={13} className="ml-0.5 opacity-60 hover:opacity-100" />
          </button>
        ) : null}

        {tags.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsPickerOpen((current) => !current)}
            aria-expanded={isPickerOpen}
            aria-label="Browse tags"
            className="inline-flex items-center gap-2 rounded-2xl bg-line/20 px-4 py-2 text-[12px] font-bold tracking-tight text-muted transition-all hover:bg-line/30 hover:text-ink"
          >
            <Tag size={13} strokeWidth={2.5} />
            <span>{activeTag ? 'Change' : 'Browse'}</span>
            <ChevronDown
              size={13}
              className={clsx(
                'transition-transform duration-300',
                isPickerOpen ? 'rotate-180' : '',
              )}
            />
          </button>
        ) : null}
      </div>

      {isPickerOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closePicker}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-32px)] sm:w-[320px] md:w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full rounded-xl border border-line/30 bg-elevated p-0 shadow-2xl backdrop-blur-xl"
            >
            {/* Header */}
              <div className="flex items-start justify-between border-b border-line/20 px-3 py-3 sm:px-4 sm:py-3.5">
                <div className="flex-1 pr-3">
                  <p className="text-sm font-semibold text-ink">Tags</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {isManaging
                      ? 'Rename or remove labels across your notes.'
                      : 'Choose a label to narrow the note list.'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                {activeTag ? (
                  <button
                    type="button"
                    onClick={() => selectTag('')}
                    className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    Clear
                  </button>
                ) : null}
                {tags.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManaging((current) => !current);
                      setEditingTag('');
                      setDraftTag('');
                    }}
                    className="text-xs font-medium text-muted transition-colors hover:text-ink"
                  >
                    {isManaging ? 'Done' : 'Manage'}
                  </button>
                ) : null}
              </div>
            </div>

            {/* Tag List */}
            <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5 sm:p-2">
              <AnimatePresence mode="popLayout">
                {tags.map(({ tag, count }) => {
                  const isActive = activeTag === tag;
                  const isEditing = editingTag === tag;

                  if (isEditing) {
                    return (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-lg border border-line/40 bg-elevated/50 p-2.5 shadow-sm"
                      >
                      <input
                        ref={inputRef}
                        type="text"
                        value={draftTag}
                        onChange={(event) => setDraftTag(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            submitRename();
                          } else if (event.key === 'Escape') {
                            event.preventDefault();
                            setEditingTag('');
                            setDraftTag('');
                          }
                        }}
                        className="w-full rounded-md border border-line/40 bg-canvas/60 px-2.5 py-1.5 font-mono text-[13px] text-ink outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                      />
                      <div className="mt-2 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag('');
                            setDraftTag('');
                          }}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={submitRename}
                          className="rounded-md bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/30"
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={tag}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.15 }}
                    className={clsx(
                      'group flex items-center gap-1.5 rounded-lg transition-all',
                      isActive
                        ? 'bg-accent/10'
                        : 'hover:bg-line/20',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectTag(isActive ? '' : tag)}
                      className={clsx(
                        'flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-sm transition-all sm:px-3 sm:py-2',
                        isActive
                          ? 'text-accent'
                          : 'text-muted hover:text-ink',
                      )}
                    >
                      <span className="flex items-center gap-1.5 truncate font-mono text-[13px] font-medium">
                        <span className="opacity-40">#</span>
                        {tag}
                      </span>
                      <span
                        className={clsx(
                          'ml-3 flex items-center gap-2 rounded-full px-2 py-0.5 font-mono text-[10px]',
                          isActive
                            ? 'bg-accent/20 text-accent'
                            : 'bg-line/30 text-muted',
                        )}
                      >
                        {count}
                        {isActive && <Check size={12} className="ml-0.5" />}
                      </span>
                    </button>

                    {isManaging ? (
                      <div className="flex shrink-0 items-center gap-0.5 pr-1.5">
                        <button
                          type="button"
                          onClick={() => startEditing(tag)}
                          aria-label={`Rename ${tag} tag`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-line/30 hover:text-ink"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag)}
                          aria-label={`Delete ${tag} tag`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
        </>
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTag)}
        title={
          pendingDeleteTag ? `Delete #${pendingDeleteTag}?` : 'Delete tag?'
        }
        description="This removes the tag from every note that currently uses it."
        confirmLabel="Delete tag"
        onClose={() => setPendingDeleteTag('')}
        onConfirm={() => {
          void onDeleteTag(pendingDeleteTag);

          if (editingTag === pendingDeleteTag) {
            setEditingTag('');
            setDraftTag('');
          }
        }}
      />
    </div>
  );
}

export default TagFilterBar;
