import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Columns,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PanelLeft,
  PanelTop,
  Quote,
  Rows,
  Strikethrough,
  Table as TableIcon,
  Trash,
} from 'lucide-react';

function ToolbarButton({
  active = false,
  title,
  onClick,
  children,
  buttonRef,
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-pressed={active}
      aria-label={title}
      title={title}
      className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
        active
          ? 'bg-line/50 text-ink'
          : 'text-muted hover:bg-line/30 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px shrink-0 self-center bg-line" />;
}

function TableToolbarButton({
  title,
  label,
  onClick,
  children,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default disabled:opacity-40 ${
        danger
          ? 'text-red-500 hover:bg-red-500/10 focus-visible:ring-red-500/25 dark:text-red-400 dark:hover:bg-red-400/10'
          : 'text-muted hover:bg-canvas hover:text-ink focus-visible:ring-accent/30'
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';

function EditorToolbar({
  editor,
  onOpenLink,
  onAddImage,
  onAddTable,
  isLinkMenuActive,
  linkButtonRef,
}) {
  const activeState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive('bold'),
      italic: currentEditor.isActive('italic'),
      strike: currentEditor.isActive('strike'),
      heading1: currentEditor.isActive('heading', { level: 1 }),
      heading2: currentEditor.isActive('heading', { level: 2 }),
      quote: currentEditor.isActive('blockquote'),
      alignLeft: currentEditor.isActive({ textAlign: 'left' }),
      alignCenter: currentEditor.isActive({ textAlign: 'center' }),
      alignRight: currentEditor.isActive({ textAlign: 'right' }),
      alignJustify: currentEditor.isActive({ textAlign: 'justify' }),
      bulletList: currentEditor.isActive('bulletList'),
      orderedList: currentEditor.isActive('orderedList'),
      taskList: currentEditor.isActive('taskList'),
      link: currentEditor.isActive('link'),
      table: currentEditor.isActive('table'),
      canToggleHeaderRow: currentEditor
        .can()
        .chain()
        .focus()
        .toggleHeaderRow()
        .run(),
      canToggleHeaderColumn: currentEditor
        .can()
        .chain()
        .focus()
        .toggleHeaderColumn()
        .run(),
      canAddRowAfter: currentEditor.can().chain().focus().addRowAfter().run(),
      canDeleteRow: currentEditor.can().chain().focus().deleteRow().run(),
      canAddColumnAfter: currentEditor
        .can()
        .chain()
        .focus()
        .addColumnAfter()
        .run(),
      canDeleteColumn: currentEditor.can().chain().focus().deleteColumn().run(),
      canDeleteTable: currentEditor.can().chain().focus().deleteTable().run(),
    }),
  });

  const textButtons = [
    {
      key: 'bold',
      title: 'Bold',
      active: activeState.bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      icon: <Bold size={16} />,
    },
    {
      key: 'italic',
      title: 'Italic',
      active: activeState.italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      icon: <Italic size={16} />,
    },
    {
      key: 'strike',
      title: 'Strikethrough',
      active: activeState.strike,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      icon: <Strikethrough size={16} />,
    },
  ];
  const structureButtons = [
    {
      key: 'h1',
      title: 'Heading 1',
      active: activeState.heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: <Heading1 size={16} />,
    },
    {
      key: 'h2',
      title: 'Heading 2',
      active: activeState.heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: <Heading2 size={16} />,
    },
    {
      key: 'quote',
      title: 'Quote',
      active: activeState.quote,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      icon: <Quote size={16} />,
    },
  ];
  const alignmentButtons = [
    {
      key: 'left',
      title: 'Align Left',
      active: activeState.alignLeft,
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
      icon: <AlignLeft size={16} />,
    },
    {
      key: 'center',
      title: 'Align Center',
      active: activeState.alignCenter,
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
      icon: <AlignCenter size={16} />,
    },
    {
      key: 'right',
      title: 'Align Right',
      active: activeState.alignRight,
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
      icon: <AlignRight size={16} />,
    },
    {
      key: 'justify',
      title: 'Justify',
      active: activeState.alignJustify,
      onClick: () => editor.chain().focus().setTextAlign('justify').run(),
      icon: <AlignJustify size={16} />,
    },
  ];
  const listButtons = [
    {
      key: 'bullet',
      title: 'Bullet List',
      active: activeState.bulletList,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: <List size={16} />,
    },
    {
      key: 'ordered',
      title: 'Numbered List',
      active: activeState.orderedList,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      icon: <ListOrdered size={16} />,
    },
    {
      key: 'task',
      title: 'Task List',
      active: activeState.taskList,
      onClick: () => editor.chain().focus().toggleTaskList().run(),
      icon: <CheckSquare size={16} />,
    },
  ];
  const tableHeaderButtons = [
    {
      key: 'header-row',
      title: 'Toggle Header Row',
      label: 'Header row',
      disabled: !activeState.canToggleHeaderRow,
      onClick: () => editor.chain().focus().toggleHeaderRow().run(),
      icon: <PanelTop size={14} />,
    },
    {
      key: 'header-column',
      title: 'Toggle Header Column',
      label: 'Header col',
      disabled: !activeState.canToggleHeaderColumn,
      onClick: () => editor.chain().focus().toggleHeaderColumn().run(),
      icon: <PanelLeft size={14} />,
    },
  ];
  const tableStructureButtons = [
    {
      key: 'add-row',
      title: 'Add Row After',
      label: 'Add row',
      disabled: !activeState.canAddRowAfter,
      onClick: () => editor.chain().focus().addRowAfter().run(),
      icon: <Rows size={14} />,
    },
    {
      key: 'delete-row',
      title: 'Delete Row',
      label: 'Delete row',
      disabled: !activeState.canDeleteRow,
      onClick: () => editor.chain().focus().deleteRow().run(),
      icon: <Rows size={14} />,
    },
    {
      key: 'add-column',
      title: 'Add Column After',
      label: 'Add col',
      disabled: !activeState.canAddColumnAfter,
      onClick: () => editor.chain().focus().addColumnAfter().run(),
      icon: <Columns size={14} />,
    },
    {
      key: 'delete-column',
      title: 'Delete Column',
      label: 'Delete col',
      disabled: !activeState.canDeleteColumn,
      onClick: () => editor.chain().focus().deleteColumn().run(),
      icon: <Columns size={14} />,
    },
  ];

  const isZenMode = useSettingsStore((state) => state.isZenMode);

  return (
    <div
      className={clsx(
        'editor-toolbar sticky top-0 z-[5] -mx-4 mb-4 transition-opacity duration-300 focus-within:opacity-100',
        isZenMode ? 'md:opacity-0 md:group-hover:opacity-100' : 'opacity-100'
      )}
    >
      <div className="border-b border-line bg-canvas/90 shadow-sm backdrop-blur">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {textButtons.map((button) => (
            <ToolbarButton
              key={button.key}
              active={button.active}
              title={button.title}
              onClick={button.onClick}
            >
              {button.icon}
            </ToolbarButton>
          ))}
          <ToolbarDivider />
          {structureButtons.map((button) => (
            <ToolbarButton
              key={button.key}
              active={button.active}
              title={button.title}
              onClick={button.onClick}
            >
              {button.icon}
            </ToolbarButton>
          ))}
          <ToolbarDivider />
          {alignmentButtons.map((button) => (
            <ToolbarButton
              key={button.key}
              active={button.active}
              title={button.title}
              onClick={button.onClick}
            >
              {button.icon}
            </ToolbarButton>
          ))}
          <ToolbarDivider />
          {listButtons.map((button) => (
            <ToolbarButton
              key={button.key}
              active={button.active}
              title={button.title}
              onClick={button.onClick}
            >
              {button.icon}
            </ToolbarButton>
          ))}
          <ToolbarDivider />
          <ToolbarButton
            buttonRef={linkButtonRef}
            active={activeState.link || isLinkMenuActive}
            title="Link"
            onClick={onOpenLink}
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Upload Image" onClick={onAddImage}>
            <ImageIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={activeState.table}
            title="Insert Table"
            onClick={onAddTable}
          >
            <TableIcon size={16} />
          </ToolbarButton>
        </div>

        {activeState.table ? (
          <div className="animate-fade-in border-t border-line/80 px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="shrink-0 rounded-full border border-line bg-panel/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Table tools
              </span>

              <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel/80 p-1">
                {tableHeaderButtons.map((button) => (
                  <TableToolbarButton
                    key={button.key}
                    title={button.title}
                    label={button.label}
                    disabled={button.disabled}
                    onClick={button.onClick}
                  >
                    {button.icon}
                  </TableToolbarButton>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel/80 p-1">
                {tableStructureButtons.map((button) => (
                  <TableToolbarButton
                    key={button.key}
                    title={button.title}
                    label={button.label}
                    disabled={button.disabled}
                    onClick={button.onClick}
                  >
                    {button.icon}
                  </TableToolbarButton>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 p-1">
                <TableToolbarButton
                  danger
                  title="Delete Table"
                  label="Delete table"
                  disabled={!activeState.canDeleteTable}
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  <Trash size={14} />
                </TableToolbarButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default EditorToolbar;
