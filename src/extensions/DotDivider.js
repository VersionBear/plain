import { mergeAttributes, Node } from '@tiptap/core';

export const DotDivider = Node.create({
  name: 'dotDivider',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="dot-divider"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'dot-divider', class: 'dot-divider' }),
      ['span', { class: 'dot' }],
      ['span', { class: 'dot' }],
      ['span', { class: 'dot' }],
    ];
  },

  addCommands() {
    return {
      setDotDivider:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .run();
        },
    };
  },
});

export default DotDivider;
