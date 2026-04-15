import { Extension } from '@tiptap/core';

export const ThreatAttributes = Extension.create({
  name: 'threatAttributes',

  addGlobalAttributes() {
    return [
      {
        types: [
          'textStyle', 'paragraph', 'heading', 'span', 
          'table', 'tableRow', 'tableCell', 'tableHeader', 
          'bulletList', 'orderedList', 'listItem', 'blockquote', 
          'image', 'video', 'audio', 'link'
        ],
        attributes: {
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style'),
            renderHTML: attributes => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
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
          dataBrand: {
            default: null,
            parseHTML: element => element.getAttribute('data-brand'),
            renderHTML: attributes => {
              if (!attributes.dataBrand) return {};
              return { 'data-brand': attributes.dataBrand };
            },
          },
          dataTag: {
            default: null,
            parseHTML: element => element.getAttribute('data-tag'),
            renderHTML: attributes => {
              if (!attributes.dataTag) return {};
              return { 'data-tag': attributes.dataTag };
            },
          }
        },
      },
    ];
  },
});
