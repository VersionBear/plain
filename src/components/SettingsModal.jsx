import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock } from 'lucide-react';
import { selectPlanTier, useFoundersStore } from '../store/useFoundersStore';
import { useOverlayFocus } from '../hooks/useOverlayFocus';
import { getPlanLabel, hasPlanAccess, PLAN_TIERS } from '../utils/planFeatures';
import { useSettingsStore } from '../store/useSettingsStore';
import { getThemeOption, getVisibleThemes } from '../utils/themes';
import clsx from 'clsx';

function SettingsModal({ isOpen, onClose, theme, setTheme }) {
  const planTier = useFoundersStore(selectPlanTier);
  const showInsightsPill = useSettingsStore((state) => state.showInsightsPill);
  const toggleInsightsPill = useSettingsStore((state) => state.toggleInsightsPill);
  const visibleThemes = getVisibleThemes(planTier);
  const activeThemeOption = getThemeOption(theme);

  const titleId = useId();
  const dialogRef = useRef(null);

  useOverlayFocus({
    isOpen,
    containerRef: dialogRef,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

  const themeSummary =
    planTier === PLAN_TIERS.FREE
      ? `${visibleThemes.length} themes available`
      : planTier === PLAN_TIERS.FOUNDER
        ? 'Pro and Founder themes included'
        : 'Pro themes included';

  const paidExtrasDescription = hasPlanAccess(planTier, PLAN_TIERS.PRO)
    ? 'Pro unlocks premium themes, note insights, and advanced PDF layout controls. Founder adds an outline panel for long notes plus founder-only themes.'
    : 'Pro unlocks note insights and advanced PDF layout controls. Founder adds an outline panel for long notes.';

  return createPortal(
    <div className="fixed inset-0 z-[130] flex animate-fade-in items-center justify-center bg-ink/45 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg animate-slide-up flex-col rounded-[28px] border border-line bg-panel p-6 shadow-2xl"
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
                  {(activeThemeOption?.preview || ['#ffffff', '#f5f5f5', '#0070f3']).map(
                    (color) => (
                      <span
                        key={color}
                        className="h-6 w-6"
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="mt-3 -mr-1 overflow-x-auto pb-1 pr-1">
                <div className="flex min-w-max gap-2">
                  {visibleThemes.map((themeOption) => {
                    const isLocked =
                      themeOption.minPlan &&
                      !hasPlanAccess(planTier, themeOption.minPlan);

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
                            ? 'border-accent bg-accent/6 shadow-[0_0_0_1px_rgba(var(--color-accent)/0.16)]'
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
                              {themeOption.minPlan
                                ? getPlanLabel(themeOption.minPlan)
                                : 'Included'}
                            </p>
                          </div>
                          {isLocked ? (
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
                  <h3 className="text-sm font-medium text-ink">Note insights</h3>
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
                    showInsightsPill ? 'bg-accent' : 'bg-line'
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
                      showInsightsPill ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </div>
              </label>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line/80 bg-elevated/60 p-4">
            <h3 className="text-sm font-medium text-ink">Paid plan extras</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {paidExtrasDescription}
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default SettingsModal;
