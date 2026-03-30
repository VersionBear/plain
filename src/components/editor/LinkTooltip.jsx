import { ExternalLink, X } from 'lucide-react';

function LinkTooltip({ linkTooltipRef, href, onEdit, onRemove, onClose }) {
  return (
    <div
      ref={linkTooltipRef}
      className="absolute left-4 top-full z-20 mt-2 flex items-center gap-2 rounded-xl border border-line bg-elevated p-2 shadow-lg"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex max-w-[200px] items-center gap-1.5 truncate text-sm text-ink hover:underline"
      >
        <ExternalLink size={14} />
        <span className="truncate">{href}</span>
      </a>
      <div className="h-4 w-px bg-line" />
      <button
        type="button"
        onClick={onEdit}
        title="Edit link"
        className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Remove link"
        className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
      >
        Remove
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close tooltip"
        className="rounded-lg p-1 text-muted transition-colors hover:bg-line/30 hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default LinkTooltip;
