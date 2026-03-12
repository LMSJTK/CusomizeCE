import { Extension } from '@tiptap/core';

/**
 * Preserves arbitrary inline style properties that aren't handled by
 * other Tiptap extensions (color, background-color, font-size,
 * line-height, text-align, font-family) through parse/render cycles.
 */
export const StylePreserver = Extension.create({
  name: 'stylePreserver',

  addGlobalAttributes() {
    const knownProperties = [
      'color',
      'background-color',
      'font-size',
      'line-height',
      'text-align',
      'font-family',
    ];

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
