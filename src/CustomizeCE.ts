import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { TiptapEditor, TiptapEditorRef } from './components/TiptapEditor';

export interface CustomizeCEConfig {
    element: HTMLElement;
    toolbarElement: HTMLElement;
    content?: string;
    onChange?: (html: string) => void;
}

export class CustomizeCE {
    private root: Root;
    private editorRef: React.RefObject<TiptapEditorRef | null>;
    private initialContent: string;

    constructor(config: CustomizeCEConfig) {
        this.initialContent = config.content || '';
        this.editorRef = React.createRef();
        this.root = createRoot(config.element);
        
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
        this.root.unmount();
    }
}
