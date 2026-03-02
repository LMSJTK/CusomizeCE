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
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { ThreatAttributes } from '../extensions/ThreatAttributes';
import { Video } from '../extensions/Video';
import { Audio } from '../extensions/Audio';
import { FontSize } from '../extensions/FontSize';
import { LineHeight } from '../extensions/LineHeight';

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
                Color,
                Highlight.configure({ multicolor: true }),
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                Video,
                Audio,
                FontSize,
                LineHeight,
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

        const addImage = () => {
            const url = window.prompt('Enter Image URL');
            if (url && editor) editor.chain().focus().setImage({ src: url }).run();
        };

        const addVideo = () => {
            const url = window.prompt('Enter Video URL');
            if (url && editor) editor.chain().focus().setVideo({ src: url }).run();
        };

        const addAudio = () => {
            const url = window.prompt('Enter Audio URL');
            if (url && editor) editor.chain().focus().setAudio({ src: url }).run();
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

                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

                    <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} disabled={isSourceMode}>Left</Button>
                    <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} disabled={isSourceMode}>Center</Button>
                    <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} disabled={isSourceMode}>Right</Button>

                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

                    <Button onClick={addImage} disabled={isSourceMode}>Image</Button>
                    <Button onClick={addVideo} disabled={isSourceMode}>Video</Button>
                    <Button onClick={addAudio} disabled={isSourceMode}>Audio</Button>

                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            disabled={isSourceMode}
                            title="Text Color"
                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.currentTarget.value }).run()}
                            value={editor.getAttributes('highlight').color || '#ffffff'}
                            disabled={isSourceMode}
                            title="Background Color"
                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <select 
                        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} 
                        disabled={isSourceMode}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        value={editor.getAttributes('textStyle').fontSize || ''}
                    >
                        <option value="">Size</option>
                        <option value="12px">12px</option>
                        <option value="16px">16px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                    </select>

                    <select 
                        onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()} 
                        disabled={isSourceMode}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        value={editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || ''}
                    >
                        <option value="">Line Height</option>
                        <option value="1">1</option>
                        <option value="1.5">1.5</option>
                        <option value="2">2</option>
                    </select>

                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    
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
