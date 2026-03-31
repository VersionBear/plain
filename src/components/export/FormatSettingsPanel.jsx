import { Image, Moon, Settings2, Sun, ChevronRight, Lock } from 'lucide-react';
import clsx from 'clsx';
import {
  selectHasProAccess,
  useFoundersStore,
} from '../../store/useFoundersStore';

function Toggle({ enabled, label, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={clsx(
        'relative h-6 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        enabled ? 'bg-accent' : 'bg-line',
      )}
    >
      <div
        className={clsx(
          'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
          enabled ? 'left-7' : 'left-1',
        )}
      />
    </button>
  );
}

function FormatSettingsPanel({
  currentFormat,
  formatIcon,
  getFormatSetting,
  selectedFormat,
  setFormatSetting,
  settings,
  setShowSettings,
  updateSettings,
}) {
  const hasProAccess = useFoundersStore(selectHasProAccess);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-canvas/30 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setShowSettings(false)}
          aria-label="Back to export formats"
          className="-ml-2 rounded-lg p-2 text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {formatIcon ? formatIcon : null}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink">
              {currentFormat?.label}
            </h3>
            <p className="truncate text-xs text-muted">
              {currentFormat?.extension}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden shrink-0 border-b border-line bg-canvas/30 px-6 py-4 md:block">
        <p className="text-sm text-muted">{currentFormat?.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="md:hidden">
            <p className="text-sm text-muted">{currentFormat?.description}</p>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Settings2 size={16} className="text-muted" />
              Export Settings
            </h4>
            <div className="space-y-3">
              {['png', 'jpeg', 'pdf', 'html'].includes(selectedFormat) ? (
                <div className="flex items-center justify-between rounded-xl bg-canvas/30 p-3">
                  <div className="flex items-center gap-3">
                    {settings.darkMode ? (
                      <Moon size={16} className="text-accent" />
                    ) : (
                      <Sun size={16} className="text-muted" />
                    )}
                    <div>
                      <span className="text-sm text-ink">Dark Mode</span>
                      <p className="text-xs text-muted">
                        Export with dark theme
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={settings.darkMode}
                    label="Toggle dark mode export"
                    onToggle={() =>
                      updateSettings({ darkMode: !settings.darkMode })
                    }
                  />
                </div>
              ) : null}

              {['png', 'jpeg', 'pdf'].includes(selectedFormat) ? (
                <div className="rounded-xl bg-canvas/30 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image size={16} className="text-muted" />
                      <span className="text-sm text-ink">Quality</span>
                    </div>
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      {getFormatSetting('scale', 2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Export scale"
                    min="1"
                    max="3"
                    step="1"
                    value={getFormatSetting('scale', 2)}
                    onChange={(event) =>
                      setFormatSetting(
                        selectedFormat,
                        'scale',
                        parseInt(event.target.value, 10),
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-line accent-accent"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>Standard</span>
                    <span>High</span>
                    <span>Ultra</span>
                  </div>
                </div>
              ) : null}

              {selectedFormat === 'jpeg' ? (
                <div className="rounded-xl bg-canvas/30 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image size={16} className="text-muted" />
                      <span className="text-sm text-ink">Compression</span>
                    </div>
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      {Math.round(getFormatSetting('quality', 0.95) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="JPEG compression quality"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={getFormatSetting('quality', 0.95)}
                    onChange={(event) =>
                      setFormatSetting(
                        selectedFormat,
                        'quality',
                        parseFloat(event.target.value),
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-line accent-accent"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>Smaller</span>
                    <span>Better</span>
                  </div>
                </div>
              ) : null}

              {selectedFormat === 'markdown' ? (
                <div className="flex items-center justify-between rounded-xl bg-canvas/30 p-3">
                  <div>
                    <span className="text-sm text-ink">Include Metadata</span>
                    <p className="text-xs text-muted">
                      Add frontmatter with ID and timestamps
                    </p>
                  </div>
                  <Toggle
                    enabled={getFormatSetting('includeMetadata', true)}
                    label="Toggle markdown metadata"
                    onToggle={() =>
                      setFormatSetting(
                        'markdown',
                        'includeMetadata',
                        !getFormatSetting('includeMetadata', true),
                      )
                    }
                  />
                </div>
              ) : null}

              {selectedFormat === 'pdf' ? (
                <div className="rounded-xl bg-canvas/30 p-3">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-sm text-ink">Page Layout</span>
                      <p className="text-xs text-muted">
                        Choose the paper size and orientation for PDF export.
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                        hasProAccess
                          ? 'bg-accent/10 text-accent'
                          : 'bg-line/40 text-muted',
                      )}
                    >
                      {!hasProAccess ? <Lock size={12} /> : null}
                      {hasProAccess ? 'Pro unlocked' : 'Pro feature'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted/80">
                        Paper size
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {['a4', 'letter'].map((pageFormat) => (
                          <button
                            key={pageFormat}
                            type="button"
                            disabled={!hasProAccess}
                            onClick={() =>
                              setFormatSetting('pdf', 'pageFormat', pageFormat)
                            }
                            className={clsx(
                              'rounded-xl border px-3 py-2 text-sm transition-colors',
                              getFormatSetting('pageFormat', 'a4') ===
                                pageFormat
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-line bg-canvas text-ink hover:border-line/80',
                              !hasProAccess &&
                                'cursor-not-allowed border-line/70 text-muted/70 hover:border-line/70',
                            )}
                          >
                            {pageFormat.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted/80">
                        Orientation
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {['portrait', 'landscape'].map((orientation) => (
                          <button
                            key={orientation}
                            type="button"
                            disabled={!hasProAccess}
                            onClick={() =>
                              setFormatSetting(
                                'pdf',
                                'orientation',
                                orientation,
                              )
                            }
                            className={clsx(
                              'rounded-xl border px-3 py-2 text-sm capitalize transition-colors',
                              getFormatSetting('orientation', 'portrait') ===
                                orientation
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-line bg-canvas text-ink hover:border-line/80',
                              !hasProAccess &&
                                'cursor-not-allowed border-line/70 text-muted/70 hover:border-line/70',
                            )}
                          >
                            {orientation}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!hasProAccess ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      Upgrade to Pro to tune PDF layout before exporting.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <div className="rounded-xl bg-line/30 p-4">
              <div className="flex items-start gap-3">
                <Settings2 size={16} className="mt-0.5 text-muted" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">Export Details</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>
                      Format: {currentFormat?.label} ({currentFormat?.extension}
                      )
                    </li>
                    <li>Theme: {settings.darkMode ? 'Dark' : 'Light'}</li>
                    {selectedFormat === 'jpeg' ? (
                      <li>
                        Quality:{' '}
                        {Math.round(getFormatSetting('quality', 0.95) * 100)}%
                      </li>
                    ) : null}
                    {['png', 'jpeg', 'pdf'].includes(selectedFormat) ? (
                      <li>Scale: {getFormatSetting('scale', 2)}x</li>
                    ) : null}
                    {selectedFormat === 'pdf' ? (
                      <>
                        <li>
                          Paper size:{' '}
                          {getFormatSetting('pageFormat', 'a4').toUpperCase()}
                        </li>
                        <li className="capitalize">
                          Orientation:{' '}
                          {getFormatSetting('orientation', 'portrait')}
                        </li>
                      </>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FormatSettingsPanel;
