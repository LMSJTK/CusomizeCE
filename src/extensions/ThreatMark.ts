import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    threat: {
      setThreat: (attributes: { 'data-threat-id': string, 'data-cue'?: string }) => ReturnType;
      toggleThreat: (attributes: { 'data-threat-id': string, 'data-cue'?: string }) => ReturnType;
      unsetThreat: () => ReturnType;
    };
  }
}

export const ThreatMark = Mark.create({
  name: 'threat',

  addAttributes() {
    return {
      'data-cue': {
        default: 'threat',
        parseHTML: element => element.getAttribute('data-cue'),
        renderHTML: attributes => {
          return { 'data-cue': attributes['data-cue'] };
        },
      },
      'data-threat-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-threat-id'),
        renderHTML: attributes => {
          if (!attributes['data-threat-id']) return {};
          return { 'data-threat-id': attributes['data-threat-id'] };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-cue="threat"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setThreat: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleThreat: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetThreat: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
