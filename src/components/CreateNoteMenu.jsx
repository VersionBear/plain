import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Lock, Sparkles, X } from 'lucide-react';
import { useOverlayFocus } from '../hooks/useOverlayFocus';
import { PLAN_TIERS, getPlanLabel } from '../utils/planFeatures';
import {
  NOTE_TEMPLATES,
  hasTemplateAccess,
} from '../utils/noteTemplates';

function CreateNoteMenu({
  isOpen,
  onClose,
  onCreateBlank,
  onCreateFromTemplate,
  onUpgrade,
  planTier = PLAN_TIERS.FREE,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useOverlayFocus({
    isOpen,
    containerRef: dialogRef,
    onClose,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTemplateSelect = (templateId) => {
    if (!hasTemplateAccess(templateId, planTier)) {
      onClose();
      onUpgrade();
      return;
    }

    onCreateFromTemplate(templateId);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[125] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Close create note menu"
            onClick={onClose}
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
          />

          {isMobile ? (
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-[28px] border border-line bg-panel shadow-2xl"
            >
              <div className="flex max-h-[85vh] flex-col px-5 pb-6 pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line/80" />
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      New note
                    </p>
                    <h2
                      id={titleId}
                      className="mt-1 text-lg font-semibold tracking-tight text-ink"
                    >
                      Start with a blank page or template
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-line/40 hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <CreateNoteMenuContent
                    onCreateBlank={onCreateBlank}
                    onSelectTemplate={handleTemplateSelect}
                    planTier={planTier}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="relative z-10 flex max-h-[min(80vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-line bg-panel p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    New note
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 text-base font-semibold tracking-tight text-ink"
                  >
                    Start with a blank page or template
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-line/40 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <CreateNoteMenuContent
                  onCreateBlank={onCreateBlank}
                  onSelectTemplate={handleTemplateSelect}
                  planTier={planTier}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function CreateNoteMenuContent({
  onCreateBlank,
  onSelectTemplate,
  planTier,
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onCreateBlank}
        className="flex w-full items-start gap-3 rounded-2xl border border-line/80 bg-canvas px-4 py-4 text-left transition-colors hover:border-line hover:bg-elevated/60"
      >
        <span className="rounded-2xl bg-line/40 p-2.5 text-ink">
          <FileText size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Blank note</span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">
            Start fresh with an empty title and editor.
          </span>
        </span>
      </button>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Starter templates</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Reusable note structures for everyday writing.
            </p>
          </div>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
            Pro
          </span>
        </div>

        <div className="space-y-2">
          {NOTE_TEMPLATES.map((template) => {
            const isLocked = !hasTemplateAccess(template.id, planTier);

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(template.id)}
                className="flex w-full items-start gap-3 rounded-2xl border border-line/80 bg-elevated/40 px-4 py-3 text-left transition-colors hover:border-line hover:bg-elevated/70"
              >
                <span
                  className={
                    isLocked
                      ? 'rounded-2xl bg-line/40 p-2.5 text-muted'
                      : 'rounded-2xl bg-accent/10 p-2.5 text-accent'
                  }
                >
                  {isLocked ? <Lock size={18} /> : <Sparkles size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">
                      {template.label}
                    </span>
                    <span className="rounded-full bg-line/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {getPlanLabel(template.minPlan)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {template.description}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {template.highlights?.map((highlight) => (
                      <span
                        key={highlight}
                        className="inline-flex items-center rounded-full bg-line/35 px-2.5 py-1 text-[11px] font-medium text-muted"
                      >
                        {highlight}
                      </span>
                    ))}
                    <span className="inline-flex items-center rounded-full bg-line/35 px-2.5 py-1 text-[11px] font-medium text-muted">
                      #{template.tags[0]}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {planTier === PLAN_TIERS.FREE ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Upgrade to Pro to unlock starter templates and advanced export controls.
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default CreateNoteMenu;
