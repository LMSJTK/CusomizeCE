import { Extension } from '@tiptap/core';

/**
 * Preserves CSS class attributes through ProseMirror parse/render cycles.
 * Without this extension, class attributes on HTML elements are silently
 * dropped when content is loaded via setHTML() and retrieved via getHTML().
 */
export const ClassPreserver = Extension.create({
  name: 'classPreserver',

  addGlobalAttributes() {
    const types = [
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'codeBlock',
      'image',
      'table',
      'tableRow',
      'tableCell',
      'tableHeader',
    ];

    return [
      {
        types,
        attributes: {
          preservedClass: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('class') || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.preservedClass) return {};
              return { class: attributes.preservedClass as string };
            },
          },
        },
      },
    ];
  },
});
