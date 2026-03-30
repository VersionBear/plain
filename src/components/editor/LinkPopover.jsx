import { X } from 'lucide-react';

function LinkPopover({
  linkPopoverRef,
  linkInputRef,
  linkText,
  linkUrl,
  onLinkTextChange,
  onLinkUrlChange,
  onClose,
  onRemove,
  onSubmit,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit(event);
    }
  };

  return (
    <form
      ref={linkPopoverRef}
      onSubmit={onSubmit}
      className="absolute left-4 right-4 top-full z-20 mt-3 rounded-2xl border border-line bg-panel p-4 shadow-xl md:left-auto md:right-4 md:w-96"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Add link</p>
          <p className="mt-1 text-xs text-muted">
            Add a link to the selected text or paste a URL.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close link popover"
          className="rounded-lg p-1 text-muted transition-colors hover:bg-line/30 hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Text to display
          </span>
          <input
            ref={linkInputRef}
            type="text"
            id="link-text-input"
            value={linkText}
            onChange={(event) => onLinkTextChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter display text"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
            URL
          </span>
          <input
            type="url"
            id="link-url-input"
            value={linkUrl}
            onChange={(event) => onLinkUrlChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRemove}
          title="Remove link"
          className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-line/30 hover:text-ink"
        >
          Remove
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            title="Cancel"
            className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-line/30 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            title="Apply link"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}

export default LinkPopover;
