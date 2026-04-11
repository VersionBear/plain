import { BubbleMenu } from '@tiptap/react/menus';
import {
  Trash2,
  LayoutPanelTop,
  LayoutPanelLeft,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine
} from 'lucide-react';
import clsx from 'clsx';

function MobileTableMenu({ editor }) {
  if (!editor) {
    return null;
  }

  const shouldShow = ({ editor: currentEditor, state }) => {
    // Only show if the selection is a TextSelection (single cell)
    // inside a table. We don't want to overlap with TableBubbleMenu.
    if (!currentEditor.isActive('table')) return false;

    return (
      state.selection.constructor.name !== 'CellSelection' &&
      !(
        state.selection.constructor.name === 'NodeSelection' &&
        state.selection.node.type.name === 'table'
      )
    );
  };

  const actionButtonClass = (danger = false, active = false) =>
    clsx(
      'flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
      danger
        ? 'text-red-500 hover:bg-red-500/10'
        : active
          ? 'bg-accent/10 text-accent hover:bg-accent/20'
          : 'text-muted hover:bg-line/40 hover:text-ink'
    );

  const iconClass = 'shrink-0';

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="mobileTableMenu"
      shouldShow={shouldShow}
      tippyOptions={{
        duration: 150,
        placement: 'top-start',
        maxWidth: 'calc(100vw - 2rem)',
        getReferenceClientRect: () => {
          try {
            const { view } = editor;
            const { selection } = view.state;
            
            // Use findParentNode to reliably find the table node from the current selection
            let tableNodePos = -1;
            
            // Walk up the node tree from the selection to find the table node
            let $pos = selection.$from;
            for (let depth = $pos.depth; depth > 0; depth--) {
              if ($pos.node(depth).type.name === 'table') {
                tableNodePos = $pos.before(depth);
                break;
              }
            }

            if (tableNodePos !== -1) {
              const domNode = view.nodeDOM(tableNodePos);
              // Handle Tiptap wrapping tables in `tableWrapper` divs.
              // nodeDOM returns the <table> element. We want its bounding box.
              if (domNode && domNode.nodeType === 1) {
                return domNode.getBoundingClientRect();
              }
            }
          } catch {
            // Ignore DOM errors
          }

          // Fallback to a zero rect so it doesn't crash or jump around
          return new DOMRect(0, 0, 0, 0);
        },
      }}
      className="md:hidden flex max-w-[calc(100vw-2rem)] overflow-x-auto rounded-[16px] border border-line/40 bg-panel/95 p-1.5 shadow-floating backdrop-blur-xl z-[100] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x overscroll-x-contain"
    >
      <div className="flex items-center gap-1 w-max px-1">
        {/* Row actions */}
        <div className="flex items-center gap-0.5 border-r border-line/40 pr-1.5 mr-0.5">
          <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted/70">
            Row
          </div>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className={actionButtonClass()}
            title="Add row above"
          >
            <ArrowUpToLine size={14} className={iconClass} />
            <span className="sr-only">Add above</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={actionButtonClass()}
            title="Add row below"
          >
            <ArrowDownToLine size={14} className={iconClass} />
            <span className="sr-only">Add below</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={actionButtonClass(true)}
            title="Delete row"
          >
            <Trash2 size={14} className={iconClass} />
          </button>
        </div>

        {/* Col actions */}
        <div className="flex items-center gap-0.5 border-r border-line/40 pr-1.5 mr-0.5">
          <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted/70">
            Col
          </div>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className={actionButtonClass()}
            title="Add column left"
          >
            <ArrowLeftToLine size={14} className={iconClass} />
            <span className="sr-only">Add left</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={actionButtonClass()}
            title="Add column right"
          >
            <ArrowRightToLine size={14} className={iconClass} />
            <span className="sr-only">Add right</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={actionButtonClass(true)}
            title="Delete column"
          >
            <Trash2 size={14} className={iconClass} />
          </button>
        </div>

        {/* Table actions */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className={actionButtonClass(
              false,
              editor.isActive('tableHeader', { row: true })
            )}
            title="Toggle Header Row"
          >
            <LayoutPanelTop size={14} className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            className={actionButtonClass(
              false,
              editor.isActive('tableHeader', { col: true })
            )}
            title="Toggle Header Column"
          >
            <LayoutPanelLeft size={14} className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={actionButtonClass(true)}
            title="Delete Table"
          >
            <Trash2 size={14} className={iconClass} />
          </button>
        </div>
      </div>
    </BubbleMenu>
  );
}

export default MobileTableMenu;