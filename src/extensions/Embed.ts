import { Node, mergeAttributes } from '@tiptap/core';

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      /**
       * Insert an iframe embed (e.g. a Vimeo or YouTube player)
       */
      setEmbed: (options: { src: string, title?: string | null }) => ReturnType;
    };
  }
}

/**
 * Converts a video page URL into an embeddable player URL.
 * Returns null when the URL is not a recognized embeddable video link
 * (e.g. a direct .mp4 file, which belongs in a <video> tag instead).
 */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Already a Vimeo player URL — keep it (including query params such as ?h= for unlisted videos).
  const player = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/(\d+)\/?((?:[?#]).*)?$/);
  if (player) {
    return `https://player.vimeo.com/video/${player[1]}${player[2] || ''}`;
  }

  // Vimeo page URLs:
  //   vimeo.com/76979871
  //   vimeo.com/76979871/8272103f6e          (unlisted hash as path segment)
  //   vimeo.com/76979871?h=8272103f6e        (unlisted hash as query param)
  //   vimeo.com/channels/staffpicks/76979871
  //   vimeo.com/groups/name/videos/76979871
  //   vimeo.com/showcase/123/video/76979871
  //   vimeo.com/album/123/video/76979871
  //   vimeo.com/manage/videos/76979871
  const vimeo = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:(?:channels\/[\w-]+|groups\/[\w-]+\/videos|showcase\/\d+\/video|album\/\d+\/video|manage\/videos)\/)?(\d+)(?:\/([0-9a-zA-Z]+))?/
  );
  if (vimeo) {
    const id = vimeo[1];
    const hash = vimeo[2] || trimmed.match(/[?&]h=([0-9a-zA-Z]+)/)?.[1];
    return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`;
  }

  // YouTube page URLs (watch, short links, shorts, live) → youtube.com/embed/<id>
  const youtube = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}`;
  }

  return null;
}

// An iframe embed node, used for Vimeo/YouTube players. Also keeps iframe
// embed code pasted or loaded from existing content instead of stripping it.
export const Embed = Node.create<EmbedOptions>({
    name: 'embed',
    group: 'block',
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
            src: { default: null },
            title: { default: null },
            width: { default: 640 },
            height: { default: 360 },
            frameborder: { default: '0' },
            allow: { default: 'autoplay; fullscreen; picture-in-picture' },
            allowfullscreen: {
                default: true,
                parseHTML: (element: HTMLElement) => element.hasAttribute('allowfullscreen'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.allowfullscreen) return {};
                    return { allowfullscreen: '' };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'iframe[src]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addNodeView() {
        // In the editor the iframe sits under a transparent overlay so clicks
        // select/drag the node (and double-click opens the edit modal) instead
        // of being swallowed by the embedded player. The saved HTML is still a
        // bare <iframe> via renderHTML above.
        return ({ HTMLAttributes }) => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-embed-view', '');

            const iframe = document.createElement('iframe');
            Object.entries(HTMLAttributes).forEach(([key, value]) => {
                if (value === null || value === undefined || value === false) return;
                iframe.setAttribute(key, value === true ? '' : String(value));
            });

            const overlay = document.createElement('div');
            overlay.setAttribute('data-embed-overlay', '');

            wrapper.append(iframe, overlay);
            return { dom: wrapper };
        };
    },

    addCommands() {
        return {
            setEmbed: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});
