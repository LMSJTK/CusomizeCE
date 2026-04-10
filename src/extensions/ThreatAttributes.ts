import { Extension } from '@tiptap/core';

export const ThreatAttributes = Extension.create({
  name: 'threatAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle', 'paragraph', 'heading', 'span', 'div'], // Added div/span for safety
        attributes: {
          dataCue: {
            default: null,
            parseHTML: element => element.getAttribute('data-cue'),
            renderHTML: attributes => {
              if (!attributes.dataCue) return {};
              return { 'data-cue': attributes.dataCue };
            },
          },
          dataThreatId: {
            default: null,
            parseHTML: element => element.getAttribute('data-threat-id'),
            renderHTML: attributes => {
              if (!attributes.dataThreatId) return {};
              return { 'data-threat-id': attributes.dataThreatId };
            },
          },
          // ADD THE DATA-BRAND ATTRIBUTE HERE:
          dataBrand: {
            default: null,
            parseHTML: element => element.getAttribute('data-brand'),
            renderHTML: attributes => {
              if (!attributes.dataBrand) return {};
              return { 'data-brand': attributes.dataBrand };
            },
          }
        },
      },
    ];
  },
});
