import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import clsx from 'clsx';

const SlashCommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (!containerRef.current) return;
    const selectedBtn = containerRef.current.querySelector('[data-selected="true"]');
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  if (!props.items || props.items.length === 0) {
    return null;
  }

  // Group items by 'group'
  const groupedItems = props.items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {});

  let globalIndex = 0;

  return (
    <div ref={containerRef} className="flex max-h-[300px] w-64 flex-col overflow-y-auto rounded-xl border border-line/40 bg-panel/95 p-1.5 shadow-2xl backdrop-blur-xl z-50">
      {Object.entries(groupedItems).map(([group, items]) => (
        <div key={group} className="mb-1.5 last:mb-0">
          <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
            {group}
          </div>
          {items.map((item) => {
            const currentIndex = globalIndex++;
            const isSelected = currentIndex === selectedIndex;
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                data-selected={isSelected}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors',
                  isSelected
                    ? 'bg-line/40 text-ink font-medium'
                    : 'text-muted hover:bg-line/20 hover:text-ink'
                )}
                onClick={() => selectItem(currentIndex)}
                onMouseEnter={() => setSelectedIndex(currentIndex)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={clsx("flex items-center justify-center rounded-md p-1", isSelected ? "bg-canvas shadow-sm text-ink" : "bg-line/30 text-muted")}>
                    <Icon size={14} />
                  </div>
                  <span className="truncate">{item.title}</span>
                </div>
                {item.shortcut && (
                  <span className="shrink-0 font-mono text-[9px] text-muted/60">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';

export default SlashCommandList;