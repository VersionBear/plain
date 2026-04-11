import { Suspense, lazy, useMemo, useRef } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import EmptyEditorState from './EmptyEditorState';
import EditorHeader from './EditorHeader';
import OutlinePanel from './OutlinePanel';
import clsx from 'clsx';
import { getNoteInsights } from '../utils/noteInsights';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en-US');

// Dynamically import heavy editor only when needed, with priority for desktop
const NoteEditor = lazy(() =>
  import('./NoteEditor').then((module) => {
    // Preload table menus for better UX
    import('./editor/TableEdgeMenu');
    import('./editor/TableBubbleMenu');
    import('./editor/MobileTableMenu');
    import('./editor/FormattingBubbleMenu');
    return module;
  })
);

function formatCount(value) {
  return numberFormatter.format(value);
}

function NoteEditorFallback() {
  return (
    <div className="flex w-full flex-col gap-6 pb-32 sm:gap-8 animate-pulse">
      <div className="h-11 w-2/3 rounded-2xl bg-line/20" />
      <div className="h-8 w-1/4 rounded-xl bg-line/15" />
      <div className="h-[50vh] rounded-2xl bg-line/10" />
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
  const isOutlinePanelOpen = useSettingsStore(
    (state) => state.isOutlinePanelOpen,
  );
  const toggleOutlinePanel = useSettingsStore(
    (state) => state.toggleOutlinePanel,
  );
  const showInsightsPill = useSettingsStore((state) => state.showInsightsPill);
  const visibleInsights = useSettingsStore((state) => state.visibleInsights);
  const currentNotes = activeSection === 'trash' ? trashedNotes : notes;
  const editorContentRef = useRef(null);
  const note = useMemo(
    () => currentNotes.find((entry) => entry.id === selectedNoteId) ?? null,
    [currentNotes, selectedNoteId],
  );
  const insights = useMemo(() => (note ? getNoteInsights(note) : null), [note]);

  const showOutline = Boolean(
    note &&
    isOutlinePanelOpen &&
    insights &&
    insights.headingCount > 0,
  );

  const statItems = insights
    ? [
        {
          key: 'words',
          label: 'Words',
          value: formatCount(insights.wordCount),
        },
        {
          key: 'characters',
          label: 'Characters',
          value: formatCount(insights.characterCount),
        },
        {
          key: 'readingTime',
          label: 'Reading time',
          value: insights.readingTimeMinutes,
        },
        {
          key: 'headings',
          label: 'Headings',
          value: formatCount(insights.headingCount),
        },
      ].filter(item => visibleInsights?.[item.key] !== false)
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
      block: 'start',
    });
  };

  if (!note) {
    return (
      <main
        className={clsx(
          "relative flex min-w-0 flex-1 flex-col bg-canvas overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "md:my-3 md:mr-3 md:rounded-[2rem] md:border md:border-line/40 md:shadow-2xl",
          isSidebarCollapsed ? "md:ml-3" : "md:ml-0"
        )}
      >
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
    <main
      className={clsx(
        "relative flex min-w-0 flex-1 flex-col bg-canvas overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "md:my-3 md:mr-3 md:rounded-[2rem] md:border md:border-line/40 md:shadow-2xl",
        isSidebarCollapsed ? "md:ml-3" : "md:ml-0"
      )}
    >
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              'flex w-full justify-center gap-6 relative',
              showOutline ? 'max-w-[1560px]' : 'max-w-6xl',
            )}
          >
            <div
              className={clsx(
                'note-print-frame w-full px-6 py-8 sm:px-10 sm:py-12 lg:py-20 max-w-[820px]',
                showOutline ? 'xl:max-w-[880px]' : '',
              )}
            >
            <div ref={editorContentRef}>
              <Suspense fallback={<NoteEditorFallback />}>
                <NoteEditor note={note} isReadOnly={activeSection === 'trash'} />
              </Suspense>
            </div>
          </div>

          {activeSection === 'notes' && showInsightsPill ? (
            <div
              className={clsx(
                'pointer-events-none fixed bottom-0 right-0 z-[60] p-4 transition-all duration-300 sm:p-6 lg:p-8',
                showOutline ? 'xl:right-72' : '',
              )}
            >
              <div className="pointer-events-auto ml-auto flex max-w-fit items-center gap-2.5 rounded-full border border-line/30 bg-panel/90 px-4 py-2 text-[11px] shadow-panel backdrop-blur-xl sm:gap-4 sm:px-5 sm:text-xs">
                <div className="flex items-center gap-3 sm:gap-4">
                  {statItems.map((item) => (
                    <div key={item.label} className="flex items-baseline gap-1">
                      <span className="font-medium text-ink">{item.value}</span>
                      <span className="text-muted sm:hidden">
                        {item.label === 'Reading time' ? 'min' : item.label === 'Words' ? 'w' : item.label === 'Characters' ? 'ch' : item.label === 'Headings' ? 'h' : item.label.slice(0, 2)}
                      </span>
                      <span className="hidden text-muted sm:inline-block">
                        {item.label === 'Reading time' ? 'min' : item.label.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  {showOutline ? (
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

          {showOutline ? (
            <aside className="hidden w-72 shrink-0 pt-20 xl:block">
              <div className="sticky top-24 rounded-2xl border border-line/30 bg-panel/80 p-4 shadow-sm backdrop-blur-xl">
                <OutlinePanel 
                  insights={insights} 
                  onJumpToHeading={jumpToHeading}
                  listClassName="max-h-[calc(100vh-12rem)]"
                />
              </div>
            </aside>
          ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Slide-in Outline */}
      <AnimatePresence>
        {showOutline && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleOutlinePanel}
              className="fixed inset-0 z-[60] bg-ink/5 backdrop-blur-[2px] xl:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-[70] flex w-72 max-w-[85vw] flex-col rounded-l-2xl border-l border-line/30 bg-panel/95 p-4 shadow-2xl backdrop-blur-xl xl:hidden"
            >
              <div className="mb-4 flex items-center justify-between pl-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Outline Panel
                </p>
                <button
                  type="button"
                  onClick={toggleOutlinePanel}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted/70 transition-colors hover:bg-line/40 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
              <OutlinePanel
                insights={insights}
                onJumpToHeading={(idx) => {
                  jumpToHeading(idx);
                  toggleOutlinePanel(); // auto-close on mobile after jumping
                }}
                listClassName="flex-1 pb-10"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export default EditorPane;
