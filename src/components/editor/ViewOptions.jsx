import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  Settings2,
  Type,
  List,
  Maximize2,
  Minimize,
  Maximize,
  Lock,
} from 'lucide-react';
import {
  selectHasFounderAccess,
  useFoundersStore,
} from '../../store/useFoundersStore';
import clsx from 'clsx';

function ViewOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const hasFounderAccess = useFoundersStore(selectHasFounderAccess);
  const isWriterMode = useSettingsStore((state) => state.isWriterMode);
  const isZenMode = useSettingsStore((state) => state.isZenMode);
  const isCompactMode = useSettingsStore((state) => state.isCompactMode);
  const isWideMode = useSettingsStore((state) => state.isWideMode);
  const isOutlinePanelOpen = useSettingsStore(
    (state) => state.isOutlinePanelOpen,
  );

  const toggleWriterMode = useSettingsStore((state) => state.toggleWriterMode);
  const toggleZenMode = useSettingsStore((state) => state.toggleZenMode);
  const toggleCompactMode = useSettingsStore(
    (state) => state.toggleCompactMode,
  );
  const toggleWideMode = useSettingsStore((state) => state.toggleWideMode);
  const toggleOutlinePanel = useSettingsStore(
    (state) => state.toggleOutlinePanel,
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleButtonClass = (active, disabled = false) =>
    clsx(
      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
      disabled && 'cursor-not-allowed opacity-70',
      active
        ? 'bg-accent/10 text-accent font-medium'
        : disabled
          ? 'text-muted/70'
          : 'text-muted hover:bg-line/50 hover:text-ink',
    );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        title="View Options"
        aria-label="View Options"
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
          isOpen || isWriterMode || isZenMode || isCompactMode || isWideMode
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:bg-line/50 hover:text-ink',
        )}
      >
        <Settings2 size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 animate-fade-in rounded-2xl border border-line bg-panel p-2 shadow-xl">
          <div className="mb-2 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted/70">
            View Options
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={toggleWriterMode}
              className={toggleButtonClass(isWriterMode)}
            >
              <Type size={16} />
              <span>Writer Font (Serif)</span>
            </button>
            <button
              type="button"
              onClick={toggleCompactMode}
              className={toggleButtonClass(isCompactMode)}
            >
              <List size={16} />
              <span>Compact Spacing</span>
            </button>
            <button
              type="button"
              onClick={toggleWideMode}
              className={toggleButtonClass(isWideMode)}
            >
              <Maximize2 size={16} />
              <span>Wide Container</span>
            </button>
            <button
              type="button"
              onClick={toggleZenMode}
              className={toggleButtonClass(isZenMode)}
            >
              {isZenMode ? <Minimize size={16} /> : <Maximize size={16} />}
              <span>Zen Mode</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!hasFounderAccess) {
                  return;
                }

                toggleOutlinePanel();
              }}
              aria-disabled={!hasFounderAccess}
              className={toggleButtonClass(
                hasFounderAccess && isOutlinePanelOpen,
                !hasFounderAccess,
              )}
            >
              <List size={16} />
              <span className="flex-1">Outline Panel</span>
              {hasFounderAccess ? (
                <span className="rounded-full bg-line/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Founder
                </span>
              ) : (
                <Lock size={14} className="text-muted/80" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewOptions;
