import { Table } from '@tiptap/extension-table';

export const CustomTable = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            styleClass: {
                default: 'table-bordered',
                parseHTML: element => element.getAttribute('data-style') || 'table-bordered',
                renderHTML: attributes => {
                    return {
                        'data-style': attributes.styleClass,
                        class: attributes.styleClass,
                    };
                },
            },
        };
    },
});
