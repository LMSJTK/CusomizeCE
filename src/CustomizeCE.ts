import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { ThreatAttributes } from './extensions/ThreatAttributes';

export interface CustomizeCEConfig {
    element: HTMLElement;
    toolbarElement: HTMLElement;
    content?: string;
    onChange?: (html: string) => void;
}

export class CustomizeCE {
    element: HTMLElement;
    toolbarElement: HTMLElement;
    editor: Editor;
    buttons: Record<string, HTMLButtonElement> = {};
    bubbleMenuElement: HTMLElement;
    sourceTextArea: HTMLTextAreaElement;
    isSourceMode: boolean = false;
    onChange?: (html: string) => void;

    constructor(config: CustomizeCEConfig) {
        this.element = config.element;
        this.toolbarElement = config.toolbarElement;
        this.onChange = config.onChange;
        
        // Create Bubble Menu Element
        this.bubbleMenuElement = document.createElement('div');
        this.bubbleMenuElement.className = 'flex items-center gap-2 p-2 bg-white shadow-lg border border-gray-200 rounded-lg';
        this.element.parentNode?.appendChild(this.bubbleMenuElement);

        const aiInput = document.createElement('input');
        aiInput.type = 'text';
        aiInput.placeholder = 'Ask AI...';
        aiInput.className = 'px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500';
        
        const aiSubmit = document.createElement('button');
        aiSubmit.innerHTML = '✨ Generate';
        aiSubmit.className = 'px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
        
        this.bubbleMenuElement.appendChild(aiInput);
        this.bubbleMenuElement.appendChild(aiSubmit);

        // 1. Initialize Tiptap
        this.editor = new Editor({
            element: this.element,
            extensions: [
                StarterKit,
                Image,
                Table.configure({
                  resizable: true,
                }),
                TableRow,
                TableHeader,
                TableCell,
                TextStyle,
                ThreatAttributes,
                BubbleMenu.configure({
                    element: this.bubbleMenuElement,
                }),
            ],
            content: config.content || '',
            onUpdate: ({ editor }) => {
                // Trigger any external callbacks
                if (typeof this.onChange === 'function') {
                    this.onChange(editor.getHTML());
                }
            },
            onSelectionUpdate: ({ editor }) => {
                // Update toolbar button states (active/inactive)
                this.updateToolbarState(); 
            }
        });

        // Create Source Text Area
        this.sourceTextArea = document.createElement('textarea');
        this.sourceTextArea.className = 'w-full h-full min-h-[250mm] outline-none resize-y font-mono text-sm bg-gray-900 text-gray-100 p-6 rounded shadow-inner hidden';
        this.sourceTextArea.addEventListener('input', () => {
            if (typeof this.onChange === 'function') {
                this.onChange(this.sourceTextArea.value);
            }
        });
        this.element.appendChild(this.sourceTextArea);

        // Handle AI Submit
        aiSubmit.onclick = () => {
            const prompt = aiInput.value;
            if (!prompt) return;
            
            aiSubmit.innerHTML = 'Generating...';
            aiSubmit.disabled = true;

            // Simulate AI response
            setTimeout(() => {
                const response = ` [AI: ${prompt}] `;
                this.editor.chain().focus().insertContent(response).run();
                aiInput.value = '';
                aiSubmit.innerHTML = '✨ Generate';
                aiSubmit.disabled = false;
            }, 1000);
        };

        // 2. Build the UI
        this.buildToolbar();
    }

    // --- Core API Methods ---
    getHTML() { 
        return this.isSourceMode ? this.sourceTextArea.value : this.editor.getHTML(); 
    }
    setHTML(html: string) { 
        if (this.isSourceMode) {
            this.sourceTextArea.value = html;
        } else {
            this.editor.commands.setContent(html); 
        }
    }
    destroy() { 
        this.editor.destroy(); 
        if (this.bubbleMenuElement.parentNode) {
            this.bubbleMenuElement.parentNode.removeChild(this.bubbleMenuElement);
        }
        if (this.sourceTextArea.parentNode) {
            this.sourceTextArea.parentNode.removeChild(this.sourceTextArea);
        }
    }
    getDOMNode() { return this.editor.view.dom; }

    // --- UI Methods ---
    buildToolbar() {
        this.toolbarElement.innerHTML = '';
        this.toolbarElement.className = 'flex flex-wrap gap-2 p-2 bg-gray-100 border-b border-gray-300 rounded-t-lg';

        this.buttons.bold = this.createButton('Bold', () => this.editor.chain().focus().toggleBold().run());
        this.buttons.italic = this.createButton('Italic', () => this.editor.chain().focus().toggleItalic().run());
        this.buttons.strike = this.createButton('Strike', () => this.editor.chain().focus().toggleStrike().run());
        this.buttons.h1 = this.createButton('H1', () => this.editor.chain().focus().toggleHeading({ level: 1 }).run());
        this.buttons.h2 = this.createButton('H2', () => this.editor.chain().focus().toggleHeading({ level: 2 }).run());
        this.buttons.bulletList = this.createButton('Bullet List', () => this.editor.chain().focus().toggleBulletList().run());
        this.buttons.orderedList = this.createButton('Ordered List', () => this.editor.chain().focus().toggleOrderedList().run());
        this.buttons.blockquote = this.createButton('Quote', () => this.editor.chain().focus().toggleBlockquote().run());
        this.buttons.undo = this.createButton('Undo', () => this.editor.chain().focus().undo().run());
        this.buttons.redo = this.createButton('Redo', () => this.editor.chain().focus().redo().run());
        
        // Add a button to simulate adding a threat
        const threatBtn = this.createButton('Add Threat Data', () => {
             this.editor.chain().focus().setMark('textStyle', { dataCue: 'threat', dataThreatId: '123' }).run();
        });
        this.toolbarElement.appendChild(threatBtn);

        const removeThreatBtn = this.createButton('Remove Threat Data', () => {
             this.editor.chain().focus().setMark('textStyle', { dataCue: null, dataThreatId: null }).removeEmptyTextStyle().run();
        });
        this.toolbarElement.appendChild(removeThreatBtn);

        // Add Source Code Toggle Button
        this.buttons.source = this.createButton('&lt;/&gt; Source', () => this.toggleSourceMode());
        this.buttons.source.classList.add('ml-auto'); // Push to the right
    }

    toggleSourceMode() {
        this.isSourceMode = !this.isSourceMode;
        const pmDom = this.editor.view.dom as HTMLElement;

        if (this.isSourceMode) {
            // Switch to source mode
            const html = this.editor.getHTML();
            // Basic formatting to make it readable
            const formattedHtml = html
                .replace(/(<\/(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th|blockquote)>)/gi, '$1\n')
                .replace(/(<(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th|blockquote)[^>]*>)/gi, '\n$1')
                .trim();
            
            this.sourceTextArea.value = formattedHtml || html;
            pmDom.style.display = 'none';
            this.sourceTextArea.style.display = 'block';
            
            // Disable other buttons
            Object.entries(this.buttons).forEach(([key, btn]) => {
                if (key !== 'source') btn.disabled = true;
            });
            this.toggleButtonActive(this.buttons.source, true);
        } else {
            // Switch to WYSIWYG mode
            const html = this.sourceTextArea.value;
            this.editor.commands.setContent(html);
            
            this.sourceTextArea.style.display = 'none';
            pmDom.style.display = 'block';
            
            // Enable other buttons
            Object.entries(this.buttons).forEach(([key, btn]) => {
                if (key !== 'source') btn.disabled = false;
            });
            this.toggleButtonActive(this.buttons.source, false);
        }
    }

    createButton(label: string, onClick: () => void) {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.className = 'px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        btn.onclick = onClick;
        this.toolbarElement.appendChild(btn);
        return btn;
    }

    updateToolbarState() {
        this.toggleButtonActive(this.buttons.bold, this.editor.isActive('bold'));
        this.toggleButtonActive(this.buttons.italic, this.editor.isActive('italic'));
        this.toggleButtonActive(this.buttons.strike, this.editor.isActive('strike'));
        this.toggleButtonActive(this.buttons.h1, this.editor.isActive('heading', { level: 1 }));
        this.toggleButtonActive(this.buttons.h2, this.editor.isActive('heading', { level: 2 }));
        this.toggleButtonActive(this.buttons.bulletList, this.editor.isActive('bulletList'));
        this.toggleButtonActive(this.buttons.orderedList, this.editor.isActive('orderedList'));
        this.toggleButtonActive(this.buttons.blockquote, this.editor.isActive('blockquote'));
    }

    toggleButtonActive(btn: HTMLButtonElement, isActive: boolean) {
        if (!btn) return;
        if (isActive) {
            btn.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-300');
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        } else {
            btn.classList.remove('bg-indigo-100', 'text-indigo-700', 'border-indigo-300');
            btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        }
    }
}
