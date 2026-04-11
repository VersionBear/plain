import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  HardDrive,
  Palette,
  ListChecks,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  FolderSync,
  Sparkles,
  Hash,
  Pin,
  Slash,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { THEME_OPTIONS } from '../utils/themes';
import { markOnboardingComplete } from '../utils/onboarding';
import OnboardingStep from './OnboardingStep';
import clsx from 'clsx';

const STEPS = [
  { id: 'welcome', icon: FileText },
  { id: 'theme', icon: Palette },
  { id: 'storage', icon: HardDrive },
  { id: 'features', icon: ListChecks },
  { id: 'ready', icon: Sparkles },
];

function OnboardingFlow({ isOpen, onComplete, theme, setTheme }) {
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef(null);

  const storageStatus = useNotesStore((state) => state.storageStatus);
  const connectFolderStorage = useNotesStore(
    (state) => state.connectFolderStorage,
  );

  const totalSteps = STEPS.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const goNext = () => {
    if (isLast) {
      markOnboardingComplete();
      onComplete?.();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const handleOnboardingComplete = () => {
    // Select the welcome note if it exists
    const welcomeNote = useNotesStore.getState().notes.find(n => n.title === 'Welcome to Plain');
    if (welcomeNote) {
      useNotesStore.getState().selectNote(welcomeNote.id);
    }
    
    markOnboardingComplete();
    onComplete?.();
  };

  const handleSkip = () => {
    handleOnboardingComplete();
  };

  const handleStartWriting = () => {
    handleOnboardingComplete();
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
    if (newDirection > 0) goNext();
    else goBack();
  };

  const actualStep = Math.max(0, Math.min(page, totalSteps - 1));

  const renderStepContent = () => {
    switch (actualStep) {
      case 0:
        return (
          <OnboardingStep
            image="/favicon.svg"
            title="Welcome to Plain"
            description="A fast, local-first notes app. Your notes live on this device — no accounts, no sync, no fuss."
            step={1}
            totalSteps={totalSteps}
          />
        );

      case 1:
        return (
          <OnboardingStep
            icon={Palette}
            title="Pick a look you like"
            description="Choose a theme now, or change it anytime in Settings."
            step={2}
            totalSteps={totalSteps}
          >
            <div className="grid grid-cols-4 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  aria-label={`Select ${t.label} theme`}
                  className={clsx(
                    'group relative overflow-hidden rounded-xl p-1.5 text-left transition-all duration-200',
                    theme === t.id
                      ? 'ring-2 ring-accent'
                      : 'border border-line/30 hover:border-line/60',
                  )}
                >
                  <div className="overflow-hidden rounded-lg border border-line/50">
                    <div className="flex h-5 w-full">
                      {t.preview.map((color) => (
                        <span
                          key={color}
                          className="flex-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p
                    className={clsx(
                      'mt-1 text-[9px] font-medium transition-colors',
                      theme === t.id ? 'text-accent' : 'text-muted/60',
                    )}
                  >
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </OnboardingStep>
        );

      case 2:
        return (
          <OnboardingStep
            icon={HardDrive}
            title="Where your notes live"
            description={
              storageStatus?.hasFolderConnection
                ? 'Your folder is connected. Notes save as Markdown files you can manage yourself.'
                : 'Browser-only notes stay in this browser. Connect a folder anytime for Markdown files on disk.'
            }
            step={3}
            totalSteps={totalSteps}
          >
            {!storageStatus?.hasFolderConnection &&
              storageStatus?.supportsFolderPicker && (
                <button
                  type="button"
                  onClick={() => void connectFolderStorage()}
                  disabled={storageStatus?.isConnectingFolder}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line/40 bg-elevated/50 px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-elevated/70 disabled:opacity-50"
                >
                  <FolderSync size={14} />
                  {storageStatus?.isConnectingFolder
                    ? 'Connecting...'
                    : storageStatus?.hasStoredFolderHandle
                      ? 'Reconnect folder'
                      : 'Connect a folder'}
                </button>
              )}
            <p className="mt-3 text-[11px] leading-relaxed text-muted/50">
              No built-in sync. Your notes stay on this device in this browser.
            </p>
          </OnboardingStep>
        );

      case 3:
        return (
          <OnboardingStep
            icon={ListChecks}
            title="Quick editor tips"
            description="A few things that make writing in Plain fast."
            step={4}
            totalSteps={totalSteps}
          >
            <div className="space-y-3 text-left">
              {[
                {
                  icon: Hash,
                  title: 'Markdown shortcuts',
                  desc: 'Type #, ##, -, or 1. to format as you write.',
                },
                {
                  icon: Slash,
                  title: 'Command menu',
                  desc: 'Press / at the start of a line to insert elements.',
                },
                {
                  icon: Pin,
                  title: 'Pin important notes',
                  desc: 'Pinned notes stay at the top of your list.',
                },
              ].map(({ icon: TipIcon, title: tipTitle, desc }) => (
                <div
                  key={tipTitle}
                  className="flex items-start gap-3 rounded-xl bg-line/15 p-3"
                >
                  <div className="mt-0.5 rounded-lg bg-accent/10 p-1.5 text-accent">
                    <TipIcon size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{tipTitle}</p>
                    <p className="text-[11px] text-muted/70">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </OnboardingStep>
        );

      case 4:
        return (
          <OnboardingStep
            icon={Sparkles}
            title="You're all set"
            description="Your welcome note is already loaded. Start writing or create a new note whenever you're ready."
            step={5}
            totalSteps={totalSteps}
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm md:px-8"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleSkip} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-10 flex h-[90vh] max-h-[640px] w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-line/30 bg-panel/95 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line/10 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <img src="/favicon.svg" alt="" className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tightest text-ink">Plain</span>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip onboarding"
            className="rounded-full bg-line/10 p-2 text-muted/60 transition-colors hover:bg-line/20 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 sm:px-12 sm:py-10 custom-scrollbar">
          <div className="flex min-h-full items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={actualStep}
                custom={direction}
                variants={{
                  enter: (dir) => ({
                    opacity: 0,
                    x: dir > 0 ? 30 : -30,
                    scale: 0.98,
                  }),
                  center: {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  },
                  exit: (dir) => ({
                    opacity: 0,
                    x: dir > 0 ? -30 : 30,
                    scale: 0.98,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-line/10 px-8 py-6 bg-canvas/30 backdrop-blur-sm">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === actualStep
                    ? 'w-6 bg-accent'
                    : 'w-1.5 bg-line/40 hover:bg-line/60',
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={() => paginate(-1)}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-[13px] font-semibold text-muted/70 transition-colors hover:bg-line/30 hover:text-ink"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={handleStartWriting}
                className="inline-flex h-11 items-center gap-2.5 rounded-2xl bg-ink px-6 text-[13px] font-bold text-canvas shadow-lg shadow-ink/10 transition-all hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-0"
              >
                Start writing
                <Check size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => paginate(1)}
                className="inline-flex h-11 items-center gap-2.5 rounded-2xl bg-accent px-6 text-[13px] font-bold text-canvas shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default OnboardingFlow;
