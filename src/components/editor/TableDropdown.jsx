import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorState } from '@tiptap/react';
import {
  Table as TableIcon,
  Trash2,
  Minus,
  Rows,
  Columns,
} from 'lucide-react';
import clsx from 'clsx';
import { ToolbarButton } from './EditorToolbar';

function TableDropdown({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ rows: 0, cols: 0 });
  const [position, setPosition] = useState({ top: 0, left: 0, align: 'left' });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const tableState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      inTable: currentEditor.isActive('table'),
      canAddRowBefore: currentEditor.can().chain().focus().addRowBefore().run(),
      canAddRowAfter: currentEditor.can().chain().focus().addRowAfter().run(),
      canAddColumnBefore: currentEditor
        .can()
        .chain()
        .focus()
        .addColumnBefore()
        .run(),
      canAddColumnAfter: currentEditor
        .can()
        .chain()
        .focus()
        .addColumnAfter()
        .run(),
      canDeleteRow: currentEditor.can().chain().focus().deleteRow().run(),
      canDeleteColumn: currentEditor.can().chain().focus().deleteColumn().run(),
      canDeleteTable: currentEditor.can().chain().focus().deleteTable().run(),
    }),
  });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const alignRight = rect.right > window.innerWidth - 250;
      
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: alignRight ? rect.right + window.scrollX : rect.left + window.scrollX,
        align: alignRight ? 'right' : 'left',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (
        dropdownRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
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

  const insertTable = (rows, cols) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  const actionButtonClass = (disabled = false, danger = false) =>
    clsx(
      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
      disabled && 'cursor-not-allowed opacity-50',
      danger
        ? 'text-red-500 hover:bg-red-500/10'
        : 'text-ink hover:bg-line/50',
      !danger && disabled && 'text-muted/70'
    );

  const GridSelector = () => {
    const maxRows = 10;
    const maxCols = 10;

    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted/70 mb-1">
          Insert Table
        </div>
        <div className="grid grid-cols-10 gap-1" onMouseLeave={() => setHoveredGrid({ rows: 0, cols: 0 })}>
          {Array.from({ length: maxRows }).map((_, r) =>
            Array.from({ length: maxCols }).map((_, c) => {
              const isHovered = r < hoveredGrid.rows && c < hoveredGrid.cols;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onMouseEnter={() => setHoveredGrid({ rows: r + 1, cols: c + 1 })}
                  onClick={() => insertTable(r + 1, c + 1)}
                  className={clsx(
                    'h-5 w-5 sm:h-4 sm:w-4 rounded-[3px] border transition-colors',
                    isHovered
                      ? 'border-accent bg-accent/20'
                      : 'border-line/50 bg-canvas hover:border-accent/50'
                  )}
                  aria-label={`Insert ${r + 1}x${c + 1} table`}
                />
              );
            })
          )}
        </div>
        <div className="text-center text-xs font-medium text-muted mt-1">
          {hoveredGrid.rows > 0 && hoveredGrid.cols > 0
            ? `${hoveredGrid.rows} x ${hoveredGrid.cols}`
            : 'Select size'}
        </div>
      </div>
    );
  };

  const TableControls = () => (
    <div className="flex flex-col gap-0.5 p-2 min-w-[200px]">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted/70 mb-1 px-2 mt-1">
        Table Layout
      </div>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addRowBefore().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canAddRowBefore}
        className={actionButtonClass(!tableState.canAddRowBefore)}
      >
        <Rows size={16} />
        <span>Add Row Above</span>
      </button>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addRowAfter().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canAddRowAfter}
        className={actionButtonClass(!tableState.canAddRowAfter)}
      >
        <Rows size={16} />
        <span>Add Row Below</span>
      </button>
      
      <div className="h-px w-full bg-line/50 my-1" />
      
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addColumnBefore().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canAddColumnBefore}
        className={actionButtonClass(!tableState.canAddColumnBefore)}
      >
        <Columns size={16} />
        <span>Add Column Left</span>
      </button>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addColumnAfter().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canAddColumnAfter}
        className={actionButtonClass(!tableState.canAddColumnAfter)}
      >
        <Columns size={16} />
        <span>Add Column Right</span>
      </button>
      
      <div className="h-px w-full bg-line/50 my-1" />

      <button
        type="button"
        onClick={() => {
          editor.commands.setContent('', false);
          setIsOpen(false);
        }}
        className={actionButtonClass(false)}
      >
        <Minus size={16} />
        <span>Clear Cell</span>
      </button>

      <div className="h-px w-full bg-line/50 my-1" />
      
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteRow().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canDeleteRow}
        className={actionButtonClass(!tableState.canDeleteRow, true)}
      >
        <Trash2 size={16} />
        <span>Delete Row</span>
      </button>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteColumn().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canDeleteColumn}
        className={actionButtonClass(!tableState.canDeleteColumn, true)}
      >
        <Trash2 size={16} />
        <span>Delete Column</span>
      </button>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          setIsOpen(false);
        }}
        disabled={!tableState.canDeleteTable}
        className={actionButtonClass(!tableState.canDeleteTable, true)}
      >
        <Trash2 size={16} />
        <span>Delete Table</span>
      </button>
    </div>
  );

  return (
    <>
      <ToolbarButton
        buttonRef={buttonRef}
        active={tableState.inTable || isOpen}
        title="Table Options"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <TableIcon size={16} />
      </ToolbarButton>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className={clsx(
            "absolute z-[100] animate-fade-in rounded-2xl border border-line bg-panel shadow-xl",
            position.align === 'right' && "-translate-x-full"
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {tableState.inTable ? <TableControls /> : <GridSelector />}
        </div>,
        document.body
      )}
    </>
  );
}

export default TableDropdown;
