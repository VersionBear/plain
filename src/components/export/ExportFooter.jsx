import { AlertCircle, ChevronRight, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

function ExportFooter({
  currentFormat,
  exportError,
  exportProgress,
  handleExport,
  isExporting,
  setShowSettings,
  showSettings,
}) {
  return (
    <div className="shrink-0 border-t border-line bg-canvas/50 px-4 py-4 md:px-6">
      {exportProgress?.stage === 'error' ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-red-500/10 p-3 text-red-500">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1 text-sm">
            {exportError || 'Export failed'}
          </span>
        </div>
      ) : exportProgress ? (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="capitalize text-ink">
              {exportProgress.stage}...
            </span>
            <span className="text-muted">{exportProgress.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${exportProgress.progress}%` }}
              className="h-full bg-accent"
            />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        {showSettings ? (
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="rounded-xl border border-line p-3 text-muted transition-colors hover:bg-line/50 hover:text-ink md:hidden"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className={clsx(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all',
            isExporting
              ? 'cursor-not-allowed bg-line text-muted'
              : 'bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent/90 hover:shadow-accent/30',
          )}
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={18} />
              <span className="hidden md:inline">
                Export as {currentFormat?.label}
              </span>
              <span className="md:hidden">Export</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ExportFooter;
