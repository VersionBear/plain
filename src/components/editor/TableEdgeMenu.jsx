import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, GripVertical, GripHorizontal, Settings2, LayoutPanelTop, LayoutPanelLeft } from 'lucide-react';
import clsx from 'clsx';

export default function TableEdgeMenu({ editor }) {
  const [activeRow, setActiveRow] = useState(null);
  const [activeCol, setActiveCol] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [lockedRow, setLockedRow] = useState(false);
  const [lockedCol, setLockedCol] = useState(false);
  const [lockedCorner, setLockedCorner] = useState(false);
  const currentCellRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return; // Disable hover logic on mobile screens
      
      // Don't change hover state if any menu is locked open
      if (lockedRow || lockedCol || lockedCorner) return;

      const isControl = e.target.closest('.table-edge-menu');
      if (isControl) {
        clearTimeout(hideTimeoutRef.current);
        return;
      }

      const td = e.target.closest('td, th');
      const table = e.target.closest('table');

      if (td && table && editor.view.dom.contains(table)) {
        clearTimeout(hideTimeoutRef.current);

        if (currentCellRef.current === td) return;
        currentCellRef.current = td;

        const tr = td.closest('tr');
        const tdRect = td.getBoundingClientRect();
        const trRect = tr.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();

        setActiveRow({
          top: trRect.top,
          left: tableRect.left,
          height: trRect.height,
          cell: td,
        });

        setActiveCol({
          top: tableRect.top,
          left: tdRect.left,
          width: tdRect.width,
          cell: td,
        });

        setActiveTable({
          top: tableRect.top,
          left: tableRect.left,
          table: table
        });
      } else {
        if (currentCellRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setActiveRow(null);
            setActiveCol(null);
            setActiveTable(null);
            currentCellRef.current = null;
          }, 350);
        }
      }
    };

    const handleScroll = () => {
      // Don't unmount controls if they are actively locked open
      if (lockedRow || lockedCol || lockedCorner) {
        return;
      }
      
      if (currentCellRef.current) {
        setActiveRow(null);
        setActiveCol(null);
        setActiveTable(null);
        currentCellRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleMouseMove);
      window.removeEventListener('scroll', handleScroll, true);
      clearTimeout(hideTimeoutRef.current);
    };
  }, [editor, lockedRow, lockedCol, lockedCorner]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Close locked menus when clicking anywhere else
      const isControl = e.target.closest('.table-edge-menu');
      if (!isControl) {
        if (lockedRow) setLockedRow(false);
        if (lockedCol) setLockedCol(false);
        if (lockedCorner) setLockedCorner(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [lockedRow, lockedCol, lockedCorner]);

  const selectCell = (cell) => {
    if (!cell) return;
    try {
      const pos = editor.view.posAtDOM(cell, 0);
      editor.chain().focus().setTextSelection(pos).run();
    } catch (e) {
      console.error("Failed to select cell", e);
    }
  };

  const handleAction = (action) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      action();
      hide();
    };
  };

  const hide = () => {
    setLockedRow(false);
    setLockedCol(false);
    setLockedCorner(false);
    setActiveRow(null);
    setActiveCol(null);
    setActiveTable(null);
    currentCellRef.current = null;
  };

  if (!activeRow && !activeCol && !activeTable) return null;

  const actionButtonClass = (danger = false, active = false) =>
    clsx(
      'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors w-full',
      danger
        ? 'text-red-500 hover:bg-red-500/10'
        : active
          ? 'bg-accent/10 text-accent hover:bg-accent/20'
          : 'text-muted hover:bg-line/40 hover:text-ink'
    );

  return createPortal(
    <>
      {/* Row Control (Left Edge) */}
      {activeRow && (
        <div
          className="table-edge-menu group fixed z-[100] hidden md:flex items-center justify-end pr-1.5"
          style={{
            top: activeRow.top,
            left: activeRow.left - 32,
            height: activeRow.height,
            width: 32,
          }}
        >
          {/* Action Buttons (visible on hover) */}
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pr-2 transition-opacity duration-200 ${lockedRow ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'} max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            <div className="flex flex-col items-center gap-1 rounded-[14px] border border-line/40 bg-panel/95 p-1.5 shadow-floating backdrop-blur-xl">
              <div className="flex items-center justify-center h-6 w-full text-[10px] font-medium uppercase tracking-wider text-muted/70 pb-0.5 border-b border-line/40 mb-0.5">
                Row
              </div>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeRow.cell);
                  editor.chain().focus().addRowBefore().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/40 hover:text-ink"
                title="Add row above"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeRow.cell);
                  editor.chain().focus().deleteRow().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                title="Delete row"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeRow.cell);
                  editor.chain().focus().addRowAfter().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/40 hover:text-ink"
                title="Add row below"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          {/* Handle Icon */}
          <div 
            className={`flex h-full w-full cursor-pointer items-center justify-end transition-colors ${lockedRow ? 'text-muted' : 'text-muted/30 hover:text-muted'}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLockedRow(!lockedRow);
              setLockedCol(false);
              setLockedCorner(false);
            }}
          >
            <div className="flex w-4 items-center justify-center">
              <GripVertical size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Col Control (Top Edge) */}
      {activeCol && (
        <div
          className="table-edge-menu group fixed z-[100] hidden md:flex items-end justify-center pb-1.5"
          style={{
            top: activeCol.top - 32,
            left: activeCol.left,
            width: activeCol.width,
            height: 32,
          }}
        >
          {/* Action Buttons (visible on hover) */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 pb-2 transition-opacity duration-200 ${lockedCol ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'} max-w-[calc(100vw-32px)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            <div className="flex items-center gap-1 rounded-[14px] border border-line/40 bg-panel/95 p-1.5 shadow-floating backdrop-blur-xl">
              <div className="flex items-center justify-center px-1 text-[10px] font-medium uppercase tracking-wider text-muted/70 pr-2 border-r border-line/40 mr-0.5">
                Col
              </div>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeCol.cell);
                  editor.chain().focus().addColumnBefore().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/40 hover:text-ink"
                title="Add column left"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeCol.cell);
                  editor.chain().focus().deleteColumn().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10"
                title="Delete column"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleAction(() => {
                  selectCell(activeCol.cell);
                  editor.chain().focus().addColumnAfter().run();
                })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/40 hover:text-ink"
                title="Add column right"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          {/* Handle Icon */}
          <div 
            className={`flex h-full w-full cursor-pointer items-end justify-center transition-colors ${lockedCol ? 'text-muted' : 'text-muted/30 hover:text-muted'}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLockedCol(!lockedCol);
              setLockedRow(false);
              setLockedCorner(false);
            }}
          >
            <div className="flex h-4 items-center justify-center">
              <GripHorizontal size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Table Corner Control (Top-Left Edge) */}
      {activeTable && (
        <div
          className="table-edge-menu group fixed z-[100] hidden md:flex items-end justify-end pb-1.5 pr-1.5"
          style={{
            top: activeTable.top - 32,
            left: activeTable.left - 32,
            width: 32,
            height: 32,
          }}
        >
          {/* Action Buttons (visible on hover) */}
          <div className={`absolute bottom-4 right-4 translate-x-1/2 pb-2 pr-2 transition-opacity duration-200 ${lockedCorner ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'} max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            <div className="flex flex-col items-stretch gap-1 rounded-[14px] border border-line/40 bg-panel/95 p-1.5 shadow-floating backdrop-blur-xl w-36">
              <button
                type="button"
                onClick={handleAction(() => {
                  editor.chain().focus().toggleHeaderRow().run();
                })}
                className={actionButtonClass(false, editor.isActive('tableHeader', { row: true }))}
                title="Toggle Header Row"
              >
                <LayoutPanelTop size={14} />
                <span>Header Row</span>
              </button>
              <button
                type="button"
                onClick={handleAction(() => {
                  editor.chain().focus().toggleHeaderColumn().run();
                })}
                className={actionButtonClass(false, editor.isActive('tableHeader', { col: true }))}
                title="Toggle Header Column"
              >
                <LayoutPanelLeft size={14} />
                <span>Header Col</span>
              </button>
              <div className="h-[1px] w-full bg-line/40 my-0.5" />
              <button
                type="button"
                onClick={handleAction(() => {
                  editor.chain().focus().deleteTable().run();
                })}
                className={actionButtonClass(true)}
                title="Delete Table"
              >
                <Trash2 size={14} />
                <span>Delete Table</span>
              </button>
            </div>
          </div>
          
          {/* Handle Icon */}
          <div 
            className={`flex h-full w-full cursor-pointer items-end justify-end transition-colors ${lockedCorner ? 'text-muted' : 'text-muted/30 hover:text-muted'}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLockedCorner(!lockedCorner);
              setLockedRow(false);
              setLockedCol(false);
            }}
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <Settings2 size={16} />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
