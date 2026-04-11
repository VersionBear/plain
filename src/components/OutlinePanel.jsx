import clsx from 'clsx';
import { ListTree } from 'lucide-react';

export default function OutlinePanel({ insights, onJumpToHeading, className, listClassName }) {
  if (!insights || insights.headingCount === 0) return null;

  return (
    <div className={clsx("flex flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <ListTree size={14} className="text-muted/70" />
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Outline
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted/50">
          {insights.headingCount} {insights.headingCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className={clsx("flex flex-col gap-[2px] overflow-y-auto pr-1", listClassName)}>
        {insights.headings.map((heading, index) => {
          const paddingLeft = 
            heading.level === 1 ? 'pl-2' :
            heading.level === 2 ? 'pl-6' :
            heading.level === 3 ? 'pl-10' :
            heading.level === 4 ? 'pl-14' :
            heading.level === 5 ? 'pl-[4.5rem]' : 'pl-[5.5rem]';

          return (
            <button
              key={`${heading.level}-${heading.text}-${index}`}
              type="button"
              onClick={() => onJumpToHeading(index)}
              className={clsx(
                'group relative flex w-full items-center gap-2.5 rounded-xl py-2 pr-3 text-left text-[13px] text-muted transition-colors hover:bg-line/40 hover:text-ink',
                paddingLeft
              )}
            >
              {/* Add a vertical guiding line for nested items */}
              {heading.level > 1 && (
                <div 
                  className="absolute bottom-0 top-0 w-px bg-line/40 transition-colors group-hover:bg-line/80"
                  style={{ left: `${(heading.level - 2) * 16 + 8 + 4}px` }}
                />
              )}
              
              <span className="shrink-0 font-mono text-[9px] font-medium text-muted/40 transition-colors group-hover:text-muted/70">
                H{heading.level}
              </span>
              <span className="truncate leading-tight">
                {heading.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
