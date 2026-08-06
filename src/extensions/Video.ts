import { Node, mergeAttributes } from '@tiptap/core';
import { getEmbedUrl } from './Embed';

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /**
       * Add a video
       */
      setVideo: (options: { src: string, alt?: string }) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
    name: 'video',
    group: 'block',
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
            alt: { default: null },
            controls: { default: true },
        };
    },

    parseHTML() {
        return [{ tag: 'video' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setVideo: (options) => ({ commands }) => {
                // Vimeo/YouTube page links can't play inside a <video> tag —
                // route them to the iframe embed node instead.
                const embedUrl = getEmbedUrl(options.src);
                if (embedUrl) {
                    return commands.setEmbed({ src: embedUrl, title: options.alt || null });
                }
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});
