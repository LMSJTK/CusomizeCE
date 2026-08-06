import { Node, mergeAttributes } from '@tiptap/core';

export interface LinkButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkButton: {
      /**
       * Insert (or replace the selected) linkable button
       */
      setLinkButton: (options: { href: string, label: string, class?: string | null, style?: string | null }) => ReturnType;
    };
  }
}

// Inline style applied to new buttons that don't get a CSS class, so they look
// like a button even where no stylesheet is available (e.g. rendered emails).
// Note: no font-weight here — inline font-weight >= 500 would be re-parsed as
// a bold mark and wrap the button in an extra <strong> tag on save.
export const DEFAULT_BUTTON_STYLE =
  'display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; border-radius: 6px; text-decoration: none';

// A linkable call-to-action button. Stored as
// <a data-type="button" href="...">label</a> so the published HTML stays a
// plain anchor; styling comes from a brand-kit class or the inline style.
export const LinkButton = Node.create<LinkButtonOptions>({
    name: 'button',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            href: { default: null },
            target: { default: null },
            label: {
                default: 'Button',
                parseHTML: (element: HTMLElement) => element.textContent?.trim() || 'Button',
                renderHTML: () => ({}), // rendered as the anchor's text content, not an attribute
            },
        };
    },

    parseHTML() {
        // Higher priority than the Link mark's `a[href]` rule so button anchors
        // are parsed as button nodes, not plain links.
        return [{ tag: 'a[data-type="button"]', priority: 100 }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'a',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'button' }),
            node.attrs.label || 'Button',
        ];
    },

    addCommands() {
        return {
            setLinkButton: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { ...options, label: options.label || 'Button' },
                });
            },
        };
    },
});
