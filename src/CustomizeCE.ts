import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { TiptapEditor, TiptapEditorRef } from './components/TiptapEditor';
import './index.css';

export interface CustomizeCEConfig {
    element: HTMLElement;
    toolbarElement: HTMLElement;
    content?: string;
    onChange?: (html: string) => void;
}

const rootMap = new WeakMap<HTMLElement, Root>();
const unmountTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export class CustomizeCE {
    private root: Root;
    private element: HTMLElement;
    private editorRef: React.RefObject<TiptapEditorRef | null>;
    private initialContent: string;

    constructor(config: CustomizeCEConfig) {
        this.element = config.element;
        this.initialContent = config.content || '';
        this.editorRef = React.createRef();
        
        // Cancel any pending unmount for this element
        const pendingTimeout = unmountTimeouts.get(this.element);
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            unmountTimeouts.delete(this.element);
        }

        let root = rootMap.get(this.element);
        if (!root) {
            root = createRoot(this.element);
            rootMap.set(this.element, root);
        }
        this.root = root;
        
        this.root.render(
            React.createElement(TiptapEditor, {
                ref: this.editorRef,
                content: this.initialContent,
                toolbarElement: config.toolbarElement,
                onUpdate: config.onChange
            })
        );
    }

    getHTML(): string {
        return this.editorRef.current ? this.editorRef.current.getHTML() : this.initialContent;
    }

    setHTML(html: string): void {
        if (this.editorRef.current) {
            this.editorRef.current.setHTML(html);
        } else {
            this.initialContent = html;
        }
    }

    destroy(): void {
        // Wrap in setTimeout to prevent "Attempted to synchronously unmount a root while React was already rendering"
        const timeout = setTimeout(() => {
            this.root.unmount();
            rootMap.delete(this.element);
            unmountTimeouts.delete(this.element);
        }, 0);
        unmountTimeouts.set(this.element, timeout);
    }
}
