import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
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
            'inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            activeTag
              ? 'border-transparent bg-line/20 text-muted hover:border-line/50 hover:bg-line/30 hover:text-ink'
              : 'border-line/50 bg-elevated text-ink shadow-sm',
          )}
        >
          All notes
        </button>

        {activeTag ? (
          <button
            type="button"
            onClick={() => selectTag('')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line/50 bg-elevated px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:border-line hover:bg-line/20"
          >
            <span className="opacity-50">#</span>
            <span>{activeTag}</span>
            {activeTagCount > 0 ? (
              <span className="rounded bg-line/40 px-1.5 py-0.5 text-[10px] text-muted">
                {activeTagCount}
              </span>
            ) : null}
            <X size={12} className="ml-0.5 text-muted hover:text-ink" />
          </button>
        ) : null}

        {tags.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsPickerOpen((current) => !current)}
            aria-expanded={isPickerOpen}
            aria-label="Browse tags"
            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-line/20 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-line/50 hover:bg-line/30 hover:text-ink"
          >
            <Tag size={12} />
            <span>{activeTag ? 'Change tag' : 'Browse tags'}</span>
            <span className="rounded bg-line/40 px-1.5 py-0.5 text-[10px] text-muted">
              {tags.length}
            </span>
            <ChevronDown
              size={12}
              className={clsx(
                'transition-transform',
                isPickerOpen ? 'rotate-180' : '',
              )}
            />
          </button>
        ) : null}
      </div>

      {isPickerOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 animate-fade-in rounded-2xl border border-line bg-panel p-3 shadow-xl md:left-auto md:w-80">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Tags</p>
              <p className="mt-0.5 text-xs text-muted">
                {isManaging
                  ? 'Rename or remove labels across your notes.'
                  : 'Choose a label to narrow the note list.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tags.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsManaging((current) => !current);
                    setEditingTag('');
                    setDraftTag('');
                  }}
                  className="text-[11px] text-muted transition-colors hover:text-ink"
                >
                  {isManaging ? 'Done' : 'Manage'}
                </button>
              ) : null}
              {activeTag ? (
                <button
                  type="button"
                  onClick={() => selectTag('')}
                  className="text-[11px] text-muted transition-colors hover:text-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {tags.map(({ tag, count }) => {
              const isActive = activeTag === tag;
              const isEditing = editingTag === tag;

              if (isEditing) {
                return (
                  <div
                    key={tag}
                    className="rounded-xl border border-line bg-elevated p-2 shadow-sm"
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
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTag('');
                          setDraftTag('');
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-line/35 hover:text-ink"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitRename}
                        className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas transition-opacity hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={tag}
                  className={clsx(
                    'flex items-center gap-2 rounded-xl px-1 py-0.5 transition-colors',
                    isActive ? 'bg-line/25' : '',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectTag(isActive ? '' : tag)}
                    className={clsx(
                      'flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-elevated text-ink shadow-sm'
                        : 'text-muted hover:bg-line/35 hover:text-ink',
                    )}
                  >
                    <span className="flex items-center gap-0.5 truncate font-medium">
                      <span className="opacity-50">#</span>
                      {tag}
                    </span>
                    <span className="ml-3 flex items-center gap-2 text-xs text-muted">
                      <span>{count}</span>
                      {isActive ? (
                        <Check size={14} className="text-accent" />
                      ) : null}
                    </span>
                  </button>

                  {isManaging ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(tag)}
                        aria-label={`Rename ${tag} tag`}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-line/35 hover:text-ink"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag)}
                        aria-label={`Delete ${tag} tag`}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
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
