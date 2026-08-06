import { TextStyle } from '@tiptap/extension-text-style';
import type { ParseRule, TagParseRule } from '@tiptap/pm/model';

// The stock TextStyle mark only matches `span` elements that carry an inline
// `style` attribute, so plain spans like `<span class="logo">` or
// `<span data-brand="...">` were unwrapped and lost their attributes. This
// variant also keeps those spans (the attributes themselves are preserved by
// the global attributes in ThreatAttributes). Threat spans are left to the
// ThreatMark extension.
export const CustomTextStyle = TextStyle.extend({
  parseHTML() {
    // Threat spans (data-cue) belong exclusively to ThreatMark — without this
    // guard they would be double-wrapped as textStyle + threat, duplicating
    // their attributes in the output.
    const parentRules: ParseRule[] = (this.parent?.() ?? []).map(rule => {
      if (!('tag' in rule) || !rule.tag) return rule;
      const tagRule = rule as TagParseRule;
      return {
        ...tagRule,
        getAttrs: (element: HTMLElement) => {
          if (element.hasAttribute('data-cue')) return false;
          return tagRule.getAttrs ? tagRule.getAttrs(element) : null;
        },
      };
    });

    return [
      ...parentRules,
      {
        tag: 'span',
        consuming: false,
        getAttrs: (element: HTMLElement) => {
          if (element.hasAttribute('style')) return false; // the stock rule above already matched
          if (element.hasAttribute('data-cue')) return false; // threat spans belong to ThreatMark
          const hasPreservedAttribute =
            element.hasAttribute('class') ||
            element.hasAttribute('id') ||
            Array.from(element.attributes).some(attr => attr.name.startsWith('data-'));
          return hasPreservedAttribute ? {} : false;
        },
      },
    ];
  },
});
