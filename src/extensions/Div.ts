import { Node, mergeAttributes } from '@tiptap/core';

export const Div = Node.create({
    name: 'div',
    group: 'block',
    content: 'block*',
    
    parseHTML() {
        return [{ tag: 'div' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes), 0];
    },
});
