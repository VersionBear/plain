import { Check, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

import { useMemo } from 'react';

function FormatList({
  formatIcons,
  groupedFormats,
  isExporting,
  selectedFormat,
  setSelectedFormat,
  setShowSettings,
  showSettings,
}) {
  const containerClassName = useMemo(
    () =>
      clsx(
        'md:flex md:w-80 md:border-r md:border-line md:bg-canvas/30 overflow-y-auto shrink-0',
        showSettings
          ? 'hidden md:flex'
          : 'flex w-full absolute inset-0 md:static z-10 bg-panel',
      ),
    [showSettings],
  );

  return (
    <div className={containerClassName}>
      <div className="w-full space-y-6 p-4">
        <div className="mb-4 md:hidden">
          <h3 className="mb-1 text-sm font-semibold text-ink">
            Choose a format
          </h3>
          <p className="text-xs text-muted">Export creates a separate file.</p>
        </div>

        {Object.entries(groupedFormats).map(([category, categoryFormats]) => (
          <div key={category}>
            <h3 className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-muted md:block">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryFormats.map((format) => {
                const Icon = formatIcons[format.id];
                const isSelected = selectedFormat === format.id;

                return (
                  <button
                    key={format.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedFormat(format.id);

                      if (window.innerWidth < 768) {
                        setTimeout(() => setShowSettings(true), 150);
                      }
                    }}
                    disabled={isExporting}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'bg-accent text-white shadow-md shadow-accent/20'
                        : 'text-ink hover:bg-line/50',
                    )}
                  >
                    <Icon
                      size={18}
                      className={isSelected ? 'text-white' : 'text-muted'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {format.label}
                      </div>
                      <div
                        className={clsx(
                          'truncate text-xs',
                          isSelected ? 'text-white/80' : 'text-muted',
                        )}
                      >
                        {format.extension}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={16} className="text-white" />
                    ) : null}
                    <ChevronRight size={16} className="text-muted md:hidden" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FormatList;
