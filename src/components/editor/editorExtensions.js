import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Typography } from '@tiptap/extension-typography';
import PlainImage from '../../extensions/PlainImage';
import DotDivider from '../../extensions/DotDivider';
import { SlashCommand, suggestionOptions } from './SlashExtension';

// Helper to determine platform for shortcut labels


const CustomTextAlign = TextAlign.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    };
  },
});

export function getNoteEditorExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      link: false,
    }),
    Placeholder.configure({
      placeholder: 'Start typing... (Use markdown shortcuts like # or * )',
      emptyEditorClass: 'is-editor-empty',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      linkOnPaste: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: 'cursor-pointer'
      },
    }),
    PlainImage,
    DotDivider,
    Table.configure({
      resizable: true,
    }),
    CustomTextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TableRow,
    TableHeader,
    TableCell,
    Typography,
    SlashCommand.configure({
      suggestion: suggestionOptions,
    }),
  ];
}
