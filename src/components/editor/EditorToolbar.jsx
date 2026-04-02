import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from 'lucide-react';

export function ToolbarButton({
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

import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';
import TableDropdown from './TableDropdown';

function EditorToolbar({
  editor,
  onOpenLink,
  onAddImage,
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
    {
      key: 'divider',
      title: 'Insert Divider',
      active: false,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      icon: <Minus size={16} />,
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
          <TableDropdown editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default EditorToolbar;
