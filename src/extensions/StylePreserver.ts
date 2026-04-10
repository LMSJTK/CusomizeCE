import { Extension } from '@tiptap/core';

export const StylePreserver = Extension.create({
  name: 'stylePreserver',

  addGlobalAttributes() {
    // 1. EMPTY THIS ARRAY to force Tiptap to preserve ALL inline styles
    const knownProperties: string[] = []; 

    const nodeTypes = [
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
      'span', // 2. ADD span
      'div'   // 3. ADD div
    ];

    const markTypes = ['textStyle'];

    return [
      {
        types: [...nodeTypes, ...markTypes],
        attributes: {
          preservedStyle: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const style = element.getAttribute('style');
              if (!style) return null;

              const extras = style
                .split(';')
                .map((d) => d.trim())
                .filter((d) => {
                  if (!d) return false;
                  const prop = d.split(':')[0].trim().toLowerCase();
                  return !knownProperties.includes(prop);
                });

              return extras.length ? extras.join('; ') + ';' : null;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.preservedStyle) return {};
              return { style: attributes.preservedStyle as string };
            },
          },
        },
      },
    ];
  },
});
