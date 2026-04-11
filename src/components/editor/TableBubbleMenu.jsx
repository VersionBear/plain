import { BubbleMenu } from '@tiptap/react/menus';
import {
  TableCellsMerge,
  TableCellsSplit
} from 'lucide-react';
import clsx from 'clsx';

function TableBubbleMenu({ editor }) {
  if (!editor) {
    return null;
  }

  const shouldShow = ({ editor: currentEditor, state }) => {
    // Only show if the selection is a CellSelection (multiple cells selected)
    // or if the whole table is selected
    if (!currentEditor.isActive('table')) return false;
    
    return state.selection.constructor.name === 'CellSelection' || 
           (state.selection.constructor.name === 'NodeSelection' && state.selection.node.type.name === 'table');
  };

  const actionButtonClass = (danger = false, active = false) =>
    clsx(
      'flex h-8 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:gap-1.5 md:px-2.5',
      danger
        ? 'text-red-500 hover:bg-red-500/10'
        : active
          ? 'bg-accent/10 text-accent hover:bg-accent/20'
          : 'text-muted hover:bg-line/40 hover:text-ink'
    );

  const iconClass = "shrink-0";

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={shouldShow}
      tippyOptions={{ duration: 150, placement: 'top', maxWidth: 'calc(100vw - 2rem)' }}
      className="max-w-full overflow-x-auto rounded-[16px] border border-line/40 bg-panel/95 p-1.5 shadow-floating backdrop-blur-xl z-[100] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <div className="flex items-center gap-1">
        {/* Cells */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            className={actionButtonClass()}
            title="Merge Cells"
          >
            <TableCellsMerge size={14} className={iconClass} />
            <span className="hidden md:inline">Merge Cells</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            className={actionButtonClass()}
            title="Split Cell"
          >
            <TableCellsSplit size={14} className={iconClass} />
            <span className="hidden md:inline">Split Cell</span>
          </button>
        </div>
      </div>
    </BubbleMenu>
  );
}

export default TableBubbleMenu;
