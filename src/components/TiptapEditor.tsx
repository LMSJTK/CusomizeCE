import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { ThreatAttributes } from '../extensions/ThreatAttributes';

export interface TiptapEditorProps {
    content: string;
    toolbarElement: HTMLElement;
    onUpdate?: (html: string) => void;
}

export interface TiptapEditorRef {
    getHTML: () => string;
    setHTML: (html: string) => void;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
    ({ content, toolbarElement, onUpdate }, ref) => {
        const [isSourceMode, setIsSourceMode] = useState(false);
        const [sourceHtml, setSourceHtml] = useState(content);
        const [aiPrompt, setAiPrompt] = useState('');
        const [isGenerating, setIsGenerating] = useState(false);

        const editor = useEditor({
            extensions: [
                StarterKit,
                Image,
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                TextStyle,
                ThreatAttributes,
            ],
            content: content,
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                setSourceHtml(html);
                if (onUpdate) onUpdate(html);
            },
        });

        useImperativeHandle(ref, () => ({
            getHTML: () => (isSourceMode ? sourceHtml : editor?.getHTML() || ''),
            setHTML: (html: string) => {
                setSourceHtml(html);
                if (editor) {
                    editor.commands.setContent(html);
                }
            },
        }));

        const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const val = e.target.value;
            setSourceHtml(val);
            if (onUpdate) onUpdate(val);
        };

        const toggleSourceMode = () => {
            if (isSourceMode) {
                // Switching back to WYSIWYG
                editor?.commands.setContent(sourceHtml);
            } else {
                // Switching to Source
                const html = editor?.getHTML() || '';
                const formattedHtml = html
                    .replace(/(<\/(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th|blockquote)>)/gi, '$1\n')
                    .replace(/(<(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th|blockquote)[^>]*>)/gi, '\n$1')
                    .trim();
                setSourceHtml(formattedHtml || html);
            }
            setIsSourceMode(!isSourceMode);
        };

        const handleAiSubmit = () => {
            if (!aiPrompt || !editor) return;
            setIsGenerating(true);
            setTimeout(() => {
                const response = ` [AI: ${aiPrompt}] `;
                editor.chain().focus().insertContent(response).run();
                setAiPrompt('');
                setIsGenerating(false);
            }, 1000);
        };

        const renderToolbar = () => {
            if (!editor) return null;

            const Button = ({ onClick, isActive, disabled, children, className = '' }: any) => (
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className={`px-3 py-1 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } ${className}`}
                >
                    {children}
                </button>
            );

            return (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-100 border-b border-gray-300 rounded-t-lg w-full">
                    <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} disabled={isSourceMode}>Bold</Button>
                    <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} disabled={isSourceMode}>Italic</Button>
                    <Button onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} disabled={isSourceMode}>Strike</Button>
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} disabled={isSourceMode}>H1</Button>
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} disabled={isSourceMode}>H2</Button>
                    <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} disabled={isSourceMode}>Bullet List</Button>
                    <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} disabled={isSourceMode}>Ordered List</Button>
                    <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} disabled={isSourceMode}>Quote</Button>
                    <Button onClick={() => editor.chain().focus().undo().run()} disabled={isSourceMode}>Undo</Button>
                    <Button onClick={() => editor.chain().focus().redo().run()} disabled={isSourceMode}>Redo</Button>
                    
                    <Button 
                        onClick={() => editor.chain().focus().setMark('textStyle', { dataCue: 'threat', dataThreatId: '123' }).run()} 
                        disabled={isSourceMode}
                    >
                        Add Threat Data
                    </Button>
                    <Button 
                        onClick={() => editor.chain().focus().setMark('textStyle', { dataCue: null, dataThreatId: null }).removeEmptyTextStyle().run()} 
                        disabled={isSourceMode}
                    >
                        Remove Threat Data
                    </Button>

                    <Button onClick={toggleSourceMode} isActive={isSourceMode} className="ml-auto">
                        &lt;/&gt; Source
                    </Button>
                </div>
            );
        };

        return (
            <>
                {toolbarElement && createPortal(renderToolbar(), toolbarElement)}
                
                {editor && !isSourceMode && (
                    <BubbleMenu editor={editor}>
                        <div className="flex items-center gap-2 p-2 bg-white shadow-lg border border-gray-200 rounded-lg">
                            <input
                                type="text"
                                placeholder="Ask AI..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleAiSubmit}
                                disabled={isGenerating || !aiPrompt}
                                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isGenerating ? 'Generating...' : '✨ Generate'}
                            </button>
                        </div>
                    </BubbleMenu>
                )}

                <div className="w-full h-full min-h-[250mm]">
                    {isSourceMode ? (
                        <textarea
                            value={sourceHtml}
                            onChange={handleSourceChange}
                            className="w-full h-full min-h-[250mm] outline-none resize-y font-mono text-sm bg-gray-900 text-gray-100 p-6 rounded shadow-inner block"
                        />
                    ) : (
                        <EditorContent editor={editor} className="w-full h-full min-h-[250mm]" />
                    )}
                </div>
            </>
        );
    }
);
