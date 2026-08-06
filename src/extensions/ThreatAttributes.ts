import { Extension } from '@tiptap/core';

// Data attributes owned by a dedicated extension/attribute. The generic data-*
// collector below skips these so they are never duplicated or overwritten with
// stale values:
// - data-cue / data-threat-id: owned by ThreatMark on threat spans (kept as
//   named attributes on nodes and links below)
// - data-style: owned by CustomTable (table style presets)
// - data-type: node-type marker (e.g. the LinkButton node)
const MANAGED_DATA_ATTRIBUTES = ['data-cue', 'data-threat-id', 'data-style', 'data-type'];

const styleAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('style'),
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.style) return {};
    return { style: attributes.style };
  },
};

const classAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('class'),
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.class) return {};
    return { class: attributes.class };
  },
};

const idAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('id'),
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.id) return {};
    return { id: attributes.id };
  },
};

const dataCueAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('data-cue'),
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.dataCue) return {};
    return { 'data-cue': attributes.dataCue };
  },
};

const dataThreatIdAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('data-threat-id'),
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.dataThreatId) return {};
    return { 'data-threat-id': attributes.dataThreatId };
  },
};

// Captures every data-* attribute (except the managed ones above) into a single
// record, so arbitrary data attributes — data-brand, data-tag, anything a brand
// kit adds in the future — survive a load/edit/save round trip without having
// to be listed one by one.
const dataAttributes = {
  default: null as Record<string, string> | null,
  parseHTML: (element: HTMLElement) => {
    const data: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('data-') && !MANAGED_DATA_ATTRIBUTES.includes(attr.name)) {
        data[attr.name] = attr.value;
      }
    }
    return Object.keys(data).length > 0 ? data : null;
  },
  renderHTML: (attributes: Record<string, any>) => attributes.dataAttributes || {},
};

// Preserves styling and branding attributes (style, class, id, data-*) across
// all content types instead of stripping them.
export const ThreatAttributes = Extension.create({
  name: 'threatAttributes',

  addGlobalAttributes() {
    return [
      // Block, list, media and inline-widget nodes.
      {
        types: [
          'textStyle', 'paragraph', 'heading',
          'tableRow', 'tableCell', 'tableHeader',
          'bulletList', 'orderedList', 'listItem', 'blockquote',
          'codeBlock', 'horizontalRule',
          'image', 'video', 'audio', 'embed', 'div', 'button',
        ],
        attributes: {
          style: styleAttribute,
          class: classAttribute,
          id: idAttribute,
          dataCue: dataCueAttribute,
          dataThreatId: dataThreatIdAttribute,
          dataAttributes,
        },
      },
      // Tables: class is owned by CustomTable's styleClass attribute (rendered
      // together with data-style), so it is not duplicated here.
      {
        types: ['table'],
        attributes: {
          style: styleAttribute,
          id: idAttribute,
          dataCue: dataCueAttribute,
          dataThreatId: dataThreatIdAttribute,
          dataAttributes,
        },
      },
      // Links: class is owned by CustomLink, everything else is preserved here.
      {
        types: ['link'],
        attributes: {
          style: styleAttribute,
          id: idAttribute,
          dataCue: dataCueAttribute,
          dataThreatId: dataThreatIdAttribute,
          dataAttributes,
        },
      },
      // Threat spans: data-cue / data-threat-id live on the ThreatMark itself;
      // preserve styling and branding attributes alongside them.
      {
        types: ['threat'],
        attributes: {
          style: styleAttribute,
          class: classAttribute,
          id: idAttribute,
          dataAttributes,
        },
      },
    ];
  },
});
