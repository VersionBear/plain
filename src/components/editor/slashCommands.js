import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Text,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeSquare,
  Minus,
  Hash,
  Table as TableIcon,
  MoreHorizontal,
  Image as ImageIcon,
  Bold,
  Italic,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';
const alt = isMac ? '⌥' : 'Alt';
const shift = isMac ? '⇧' : 'Shift';

export const SLASH_COMMANDS = [
  {
    title: 'Heading 1',
    group: 'Structure',
    icon: Heading1,
    shortcut: `${mod}+${alt}+1`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    group: 'Structure',
    icon: Heading2,
    shortcut: `${mod}+${alt}+2`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    group: 'Structure',
    icon: Heading3,
    shortcut: `${mod}+${alt}+3`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Heading 4',
    group: 'Structure',
    icon: Heading4,
    shortcut: `${mod}+${alt}+4`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 4 }).run();
    },
  },
  {
    title: 'Heading 5',
    group: 'Structure',
    icon: Heading5,
    shortcut: `${mod}+${alt}+5`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 5 }).run();
    },
  },
  {
    title: 'Heading 6',
    group: 'Structure',
    icon: Heading6,
    shortcut: `${mod}+${alt}+6`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 6 }).run();
    },
  },
  {
    title: 'Paragraph',
    group: 'Structure',
    icon: Text,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Bullet List',
    group: 'Lists',
    icon: List,
    shortcut: `${mod}+${shift}+8`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    group: 'Lists',
    icon: ListOrdered,
    shortcut: `${mod}+${shift}+7`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    group: 'Lists',
    icon: CheckSquare,
    shortcut: `${mod}+${shift}+9`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    group: 'Blocks',
    icon: Quote,
    shortcut: `${mod}+${shift}+B`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    group: 'Blocks',
    icon: CodeSquare,
    shortcut: `${mod}+${alt}+C`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Table',
    group: 'Blocks',
    icon: TableIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: 'Divider',
    group: 'Blocks',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: '3 Dot Divider',
    group: 'Blocks',
    icon: MoreHorizontal,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDotDivider().run();
    },
  },
  {
    title: 'Tag',
    group: 'Plain',
    icon: Hash,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent('#').run();
    },
  },
  {
    title: 'Image',
    group: 'Media',
    icon: ImageIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      document.querySelector('input[type="file"][accept="image/*"]')?.click();
    },
  },
  {
    title: 'Bold',
    group: 'Format',
    icon: Bold,
    shortcut: `${mod}+B`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark('bold').run();
    },
  },
  {
    title: 'Italic',
    group: 'Format',
    icon: Italic,
    shortcut: `${mod}+I`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark('italic').run();
    },
  },
  {
    title: 'Strikethrough',
    group: 'Format',
    icon: Strikethrough,
    shortcut: `${mod}+${shift}+X`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark('strike').run();
    },
  },
  {
    title: 'Inline Code',
    group: 'Format',
    icon: Code,
    shortcut: `${mod}+E`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark('code').run();
    },
  },
  {
    title: 'Align Left',
    group: 'Alignment',
    icon: AlignLeft,
    shortcut: `${mod}+${shift}+L`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('left').run();
    },
  },
  {
    title: 'Align Center',
    group: 'Alignment',
    icon: AlignCenter,
    shortcut: `${mod}+${shift}+E`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('center').run();
    },
  },
  {
    title: 'Align Right',
    group: 'Alignment',
    icon: AlignRight,
    shortcut: `${mod}+${shift}+R`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('right').run();
    },
  },
  {
    title: 'Justify',
    group: 'Alignment',
    icon: AlignJustify,
    shortcut: `${mod}+${shift}+J`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('justify').run();
    },
  },
];
