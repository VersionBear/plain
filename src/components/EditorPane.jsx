import { Suspense, lazy, useMemo, useRef } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  selectHasFounderAccess,
  selectHasProAccess,
  useFoundersStore,
} from '../store/useFoundersStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import clsx from 'clsx';
import { getNoteInsights } from '../utils/noteInsights';
import { AnimatePresence, motion } from 'framer-motion';

const numberFormatter = new Intl.NumberFormat('en-US');
const NoteEditor = lazy(() => import('./NoteEditor'));

function formatCount(value) {
  return numberFormatter.format(value);
}

function NoteEditorFallback() {
  return (
    <div className="flex w-full flex-col gap-6 pb-32 sm:gap-8">
      <div className="h-12 w-2/3 rounded-2xl bg-line/30" />
      <div className="h-10 w-1/3 rounded-2xl bg-line/25" />
      <div className="h-[50vh] rounded-3xl bg-line/20" />
    </div>
  );
}

function EditorPane({
  totalNotes,
  searchQuery,
  isSidebarCollapsed,
  onToggleSidebar,
  activeSection,
  onCreateNote,
}) {
  const notes = useNotesStore((state) => state.notes);
  const trashedNotes = useNotesStore((state) => state.trashedNotes);
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const hasProAccess = useFoundersStore(selectHasProAccess);
  const hasFounderAccess = useFoundersStore(selectHasFounderAccess);
  const isWriterMode = useSettingsStore((state) => state.isWriterMode);
  const isWideMode = useSettingsStore((state) => state.isWideMode);
  const isOutlinePanelOpen = useSettingsStore(
    (state) => state.isOutlinePanelOpen,
  );
  const showInsightsPill = useSettingsStore((state) => state.showInsightsPill);
  const currentNotes = activeSection === 'trash' ? trashedNotes : notes;
  const editorContentRef = useRef(null);
  const note = useMemo(
    () => currentNotes.find((entry) => entry.id === selectedNoteId) ?? null,
    [currentNotes, selectedNoteId],
  );
  const insights = useMemo(() => (note ? getNoteInsights(note) : null), [note]);

  const showFounderOutline = Boolean(
    note &&
    hasFounderAccess &&
    isOutlinePanelOpen &&
    insights &&
    insights.headingCount > 0,
  );

  const statItems = insights
    ? [
        {
          label: 'Words',
          value: formatCount(insights.wordCount),
        },
        {
          label: 'Characters',
          value: formatCount(insights.characterCount),
        },
        {
          label: 'Reading time',
          value: insights.readingTimeMinutes,
        },
        ...(hasFounderAccess
          ? [
              {
                label: 'Headings',
                value: formatCount(insights.headingCount),
              },
            ]
          : []),
      ]
    : [];

  const jumpToHeading = (headingIndex) => {
    const headings = editorContentRef.current?.querySelectorAll(
      'h1, h2, h3, h4, h5, h6',
    );
    const heading = headings?.[headingIndex];

    if (!heading) {
      return;
    }

    heading.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  if (!note) {
    return (
      <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <EditorHeader
          note={null}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          activeSection={activeSection}
        />
        <EmptyEditorState
          totalNotes={totalNotes}
          searchQuery={searchQuery}
          activeSection={activeSection}
          onCreateNote={onCreateNote}
        />
      </main>
    );
  }

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
      <EditorHeader
        note={note}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        activeSection={activeSection}
      />
      <div className="note-print-shell group flex w-full flex-1 justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'flex w-full justify-center gap-6 relative',
              showFounderOutline ? 'max-w-[1560px]' : 'max-w-6xl',
            )}
          >
            <div
              className={clsx(
                'note-print-frame w-full px-6 py-8 sm:px-12 sm:py-12 lg:py-20',
                isWideMode ? 'max-w-6xl' : 'max-w-4xl',
                showFounderOutline ? 'xl:max-w-5xl' : '',
                isWriterMode ? 'font-serif' : '',
              )}
            >
            {showFounderOutline ? (
              <section className="mb-6 rounded-3xl border border-line/80 bg-elevated/70 p-4 shadow-sm xl:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      Founder outline
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Jump through long notes from one place.
                    </p>
                  </div>
                  <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-medium text-muted">
                    {insights.headingCount} headings
                  </span>
                </div>

                <div className="mt-4 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {insights.headings.map((heading, index) => (
                    <button
                      key={`${heading.level}-${heading.text}-${index}`}
                      type="button"
                      onClick={() => jumpToHeading(index)}
                      className={clsx(
                        'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-line/40 hover:text-ink',
                        heading.level >= 4
                          ? 'pl-7'
                          : heading.level === 3
                            ? 'pl-5'
                            : heading.level === 2
                              ? 'pl-4'
                              : '',
                      )}
                    >
                      <span className="rounded-full bg-line/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted/80">
                        H{heading.level}
                      </span>
                      <span className="truncate">{heading.text}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div ref={editorContentRef}>
              <Suspense fallback={<NoteEditorFallback />}>
                <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
              </Suspense>
            </div>
          </div>

          {hasProAccess && activeSection === 'notes' && showInsightsPill ? (
            <div
              className={clsx(
                'pointer-events-none fixed bottom-0 right-0 z-[60] p-4 transition-all duration-300 sm:p-6 lg:p-8',
                showFounderOutline ? 'xl:right-72' : '',
              )}
            >
              <div className="pointer-events-auto ml-auto flex max-w-fit items-center gap-2.5 rounded-full border border-line/40 bg-panel/90 px-4 py-2 text-[11px] shadow-sm backdrop-blur-md sm:gap-4 sm:px-5 sm:text-xs">
                <div className="flex items-center gap-3 sm:gap-4">
                  {statItems.map((item) => (
                    <div key={item.label} className="flex items-baseline gap-1">
                      <span className="font-medium text-ink">{item.value}</span>
                      <span className="text-muted sm:hidden">
                        {item.label === 'Reading time' ? 'm' : item.label.toLowerCase().slice(0, 1)}
                      </span>
                      <span className="hidden text-muted sm:inline-block">
                        {item.label === 'Reading time' ? 'min' : item.label.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  {showFounderOutline ? (
                    <>
                      <div className="h-3.5 w-px bg-line/60" />
                      <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent sm:px-2.5">
                        Outline
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {showFounderOutline ? (
            <aside className="hidden w-72 shrink-0 pt-20 xl:block">
              <div className="sticky top-24 rounded-3xl border border-line/80 bg-panel/90 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      Founder outline
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Jump through long notes without losing your place.
                    </p>
                  </div>
                  <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-medium text-muted">
                    {insights.headingCount}
                  </span>
                </div>

                <div className="mt-4 max-h-[calc(100vh-12rem)] space-y-1.5 overflow-y-auto pr-1">
                  {insights.headings.map((heading, index) => (
                    <button
                      key={`${heading.level}-${heading.text}-${index}`}
                      type="button"
                      onClick={() => jumpToHeading(index)}
                      className={clsx(
                        'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-line/40 hover:text-ink',
                        heading.level >= 4
                          ? 'pl-7'
                          : heading.level === 3
                            ? 'pl-5'
                            : heading.level === 2
                              ? 'pl-4'
                              : '',
                      )}
                    >
                      <span className="rounded-full bg-line/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted/80">
                        H{heading.level}
                      </span>
                      <span className="truncate">{heading.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export default EditorPane;
