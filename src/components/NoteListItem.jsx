import { memo } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { formatNoteTimestamp, formatTrashTimestamp } from '../utils/date';
import { getNotePreview, getNoteTitle, getNoteTags } from '../utils/notes';
import { getPlainTextFromContent } from '../utils/notes';
import { Pin } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

function NoteListItem({ note, onSelect, section }) {
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const selectNote = useNotesStore((state) => state.selectNote);
  const activeTag = useNotesStore((state) => state.activeTag);
  const isSelected = selectedNoteId === note.id;
  const tags = getNoteTags(note);
  const hasContent = getPlainTextFromContent(note.content).trim().length > 0;
  const visibleTags = activeTag
    ? tags.filter((tag) => tag === activeTag)
    : isSelected
      ? tags
      : [];

  return (
    <motion.div
      layout
      whileHover={{ y: -1 }}
      className={clsx(
        'group relative mx-2 flex w-auto flex-col rounded-2xl border px-4 py-4 text-left transition-all duration-300',
        isSelected
          ? 'border-line/40 bg-elevated shadow-panel backdrop-blur-sm'
          : 'border-transparent bg-transparent hover:bg-line/20',
      )}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    >
      {/* Left border accent */}
      <motion.span
        className="absolute bottom-3 left-0 top-3 w-[4px] rounded-r-full bg-accent"
        aria-hidden="true"
        initial={false}
        animate={{
          opacity: isSelected ? 1 : 0,
          scaleY: isSelected ? 1 : 0.4,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      <button
        type="button"
        onClick={() => {
          selectNote(note.id);
          onSelect?.(note.id);
        }}
        aria-label={`Select note: ${getNoteTitle(note)}`}
        aria-pressed={isSelected}
        className="w-full text-left outline-none focus-visible:relative focus-visible:rounded-[10px] focus-visible:outline-2 focus-visible:outline-[rgba(255,255,255,0.3)] focus-visible:-outline-offset-2"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3
            className={clsx(
              'flex-1 truncate text-[13px] tracking-tight transition-colors duration-150',
              isSelected
                ? 'font-semibold text-ink'
                : 'font-normal text-ink/70 group-hover:text-ink/90',
            )}
          >
            {getNoteTitle(note)}
          </h3>
          <div className="mt-[2px] flex shrink-0 items-center gap-1.5">
            {section === 'notes' && note.pinned && (
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Pin size={10} className="fill-accent/20 text-accent" />
              </motion.div>
            )}
            <motion.span
              className="whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-muted/50"
              key={section === 'trash' ? note.trashedAt ?? note.updatedAt : note.updatedAt}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {section === 'trash'
                ? formatTrashTimestamp(note.trashedAt ?? note.updatedAt)
                : formatNoteTimestamp(note.updatedAt)}
            </motion.span>
          </div>
        </div>
        {hasContent ? (
          <motion.p
            className="line-clamp-2 text-[12px] leading-relaxed text-muted/60 md:line-clamp-2"
            animate={{
              color: isSelected
                ? 'rgb(var(--color-muted) / 0.85)'
                : 'rgb(var(--color-muted) / 0.6)',
            }}
            transition={{ duration: 0.15 }}
          >
            {getNotePreview(note)}
          </motion.p>
        ) : null}
      </button>
      {visibleTags.length > 0 ? (
        <motion.div
          className="mt-2.5 flex flex-wrap gap-1.5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
        >
          {visibleTags.map((tag, index) => (
            <motion.span
              key={tag}
              className={clsx(
                'inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide',
                activeTag === tag
                  ? 'bg-accent/10 text-accent'
                  : 'bg-line/40 text-muted/90',
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
            >
              <span className="mr-[1px] opacity-60">#</span>
              <span>{tag}</span>
            </motion.span>
          ))}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default memo(NoteListItem);
