import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';
import { selectPlanTier, useFoundersStore } from '../store/useFoundersStore';
import { useOverlayFocus } from '../hooks/useOverlayFocus';
import { getPlanLabel, hasPlanAccess, PLAN_TIERS } from '../utils/planFeatures';
import {
  FOUNDER_PLAN_FEATURES,
  PRO_PLAN_FEATURES,
  getPaidExtrasDescription,
} from '../utils/planCatalog';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  getThemeAccessLabel,
  getThemeOption,
  getVisibleThemes,
  hasThemeAccess,
  isEasterThemeFreePromoActive,
} from '../utils/themes';
import clsx from 'clsx';

function SettingsModal({ isOpen, onClose, theme, setTheme }) {
  const planTier = useFoundersStore(selectPlanTier);
  const showInsightsPill = useSettingsStore((state) => state.showInsightsPill);
  const toggleInsightsPill = useSettingsStore(
    (state) => state.toggleInsightsPill,
  );
  const visibleThemes = getVisibleThemes(planTier);
  const activeThemeOption = getThemeOption(theme);
  const easterPromoActive = isEasterThemeFreePromoActive();

  const titleId = useId();
  const dialogRef = useRef(null);

  useOverlayFocus({
    isOpen,
    containerRef: dialogRef,
    onClose,
  });

  const themeSummary =
    planTier === PLAN_TIERS.FREE
      ? `${visibleThemes.length} themes available`
      : planTier === PLAN_TIERS.FOUNDER
        ? 'Pro and Founder themes included'
        : 'Pro themes included';

  const paidExtrasDescription = getPaidExtrasDescription(planTier);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            ref={dialogRef}
            role="dialog"
            aria-labelledby={titleId}
            aria-modal="true"
            tabIndex={-1}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-[28px] border border-line bg-panel p-6 shadow-2xl"
          >
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-ink"
              >
                Settings
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-muted transition-colors hover:bg-line/40 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-2">
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-ink">Theme</h3>
                    <p className="mt-1 text-xs text-muted">
                      Your current plan: {getPlanLabel(planTier)}
                    </p>
                  </div>
                  <span className="rounded-full bg-line/40 px-3 py-1 text-[11px] font-medium text-muted">
                    {themeSummary}
                  </span>
                </div>
                <div className="rounded-2xl border border-line/80 bg-elevated/60 p-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-canvas/80 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Active theme
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-ink">
                        {activeThemeOption?.label || 'Light'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-line/70 bg-panel">
                      {(
                        activeThemeOption?.preview || [
                          '#ffffff',
                          '#f5f5f5',
                          '#0070f3',
                        ]
                      ).map((color) => (
                        <span
                          key={color}
                          className="h-6 w-6"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="-mr-1 mt-3 overflow-x-auto pb-1 pr-1">
                    <div className="flex min-w-max gap-2">
                      {visibleThemes.map((themeOption) => {
                        const isLocked = !hasThemeAccess(
                          themeOption.id,
                          planTier,
                        );
                        const accessLabel = getThemeAccessLabel(
                          themeOption.id,
                          planTier,
                        );
                        const isPromoTheme =
                          themeOption.id === 'easter-bloom' &&
                          easterPromoActive &&
                          planTier === PLAN_TIERS.FREE;

                        return (
                          <button
                            key={themeOption.id}
                            onClick={() => {
                              if (isLocked) return;
                              setTheme(themeOption.id);
                            }}
                            aria-pressed={theme === themeOption.id}
                            className={clsx(
                              'w-[132px] shrink-0 rounded-2xl border p-2.5 text-left transition-all',
                              theme === themeOption.id
                                ? 'bg-accent/6 border-accent shadow-[0_0_0_1px_rgba(var(--color-accent)/0.16)]'
                                : 'border-line/80 bg-canvas hover:border-line',
                              isLocked && 'cursor-not-allowed opacity-60',
                            )}
                          >
                            <div className="overflow-hidden rounded-xl border border-line/70 bg-panel">
                              <div className="flex h-11 w-full">
                                {themeOption.preview.map((color) => (
                                  <span
                                    key={color}
                                    className="flex-1"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="mt-2 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={clsx(
                                    'truncate text-sm font-medium',
                                    theme === themeOption.id
                                      ? 'text-accent'
                                      : 'text-ink',
                                  )}
                                >
                                  {themeOption.label}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                                  {accessLabel}
                                </p>
                              </div>
                              {isPromoTheme ? (
                                <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                                  April
                                </span>
                              ) : isLocked ? (
                                <span className="rounded-full bg-line/45 p-1 text-muted">
                                  <Lock size={12} />
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {hasPlanAccess(planTier, PLAN_TIERS.PRO) ? (
                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-ink">
                        Note insights
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        Show reading time and word count.
                      </p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-canvas p-4 transition-colors hover:border-line/80">
                    <span className="text-sm font-medium text-ink">
                      Show insights pill
                    </span>
                    <div
                      className={clsx(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2',
                        showInsightsPill ? 'bg-accent' : 'bg-line',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showInsightsPill}
                        onChange={toggleInsightsPill}
                      />
                      <span
                        className={clsx(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-canvas shadow ring-0 transition duration-200 ease-in-out',
                          showInsightsPill ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </div>
                  </label>
                </section>
              ) : null}

              <section className="rounded-2xl border border-line/80 bg-elevated/60 p-4">
                <h3 className="text-sm font-medium text-ink">
                  Paid plan extras
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {paidExtrasDescription}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-line/70 bg-canvas/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Plain Pro
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Everyday upgrades for writing and focus.
                        </p>
                      </div>
                      <span className="rounded-full bg-line/40 px-2.5 py-1 text-[11px] font-medium text-muted">
                        {hasPlanAccess(planTier, PLAN_TIERS.PRO)
                          ? 'Included'
                          : 'Upgrade'}
                      </span>
                    </div>

                    <ul className="mt-4 grid gap-2">
                      {PRO_PLAN_FEATURES.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          <Check
                            size={14}
                            className="mt-0.5 shrink-0 text-accent"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-line/70 bg-canvas/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Founders Pack
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Founder-only additions on top of Pro.
                        </p>
                      </div>
                      <span className="rounded-full bg-line/40 px-2.5 py-1 text-[11px] font-medium text-muted">
                        {planTier === PLAN_TIERS.FOUNDER
                          ? 'Included'
                          : 'Founder'}
                      </span>
                    </div>

                    <ul className="mt-4 grid gap-2">
                      {FOUNDER_PLAN_FEATURES.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          <Check
                            size={14}
                            className="mt-0.5 shrink-0 text-amber-500"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SettingsModal;
