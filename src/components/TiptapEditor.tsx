import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { CustomTable } from '../extensions/CustomTable';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Video } from '../extensions/Video';
import { Audio } from '../extensions/Audio';
import { FontSize } from '../extensions/FontSize';
import { LineHeight } from '../extensions/LineHeight';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { 
    Bold, Italic, Strikethrough, Heading1, Heading2, 
    List, ListOrdered, Quote, Undo, Redo, 
    AlignLeft, AlignCenter, AlignRight, 
    Image as ImageIcon, Video as VideoIcon, Music as AudioIcon,
    Code,
    Link as LinkIcon, Unlink, Table as TableIcon, Search
} from 'lucide-react';

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
        const [showSearch, setShowSearch] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [replaceTerm, setReplaceTerm] = useState('');

        const editor = useEditor({
            extensions: [
                StarterKit,
                Image,
                CustomTable.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                TextStyle,
                Color,
                Highlight.configure({ multicolor: true }),
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                TiptapLink.configure({ openOnClick: false }),
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

        const toggleLink = () => {
            if (!editor) return;
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt('Enter URL', previousUrl || '');
            
            if (url === null) return;
            
            if (url === '') {
                editor.chain().focus().unsetLink().run();
                return;
            }

            if (editor.state.selection.empty) {
                // If no text is selected, insert the URL as text and link it
                editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
            } else {
                // If text is selected, apply the link mark
                editor.chain().focus().setLink({ href: url }).run();
            }
        };

        const insertTable = () => {
            if (!editor) return;
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        };

        const handleTableAction = (action: string) => {
            if (!editor) return;
            switch (action) {
                case 'addColumnBefore': editor.chain().focus().addColumnBefore().run(); break;
                case 'addColumnAfter': editor.chain().focus().addColumnAfter().run(); break;
                case 'deleteColumn': editor.chain().focus().deleteColumn().run(); break;
                case 'addRowBefore': editor.chain().focus().addRowBefore().run(); break;
                case 'addRowAfter': editor.chain().focus().addRowAfter().run(); break;
                case 'deleteRow': editor.chain().focus().deleteRow().run(); break;
                case 'deleteTable': editor.chain().focus().deleteTable().run(); break;
                case 'mergeCells': editor.chain().focus().mergeCells().run(); break;
                case 'splitCell': editor.chain().focus().splitCell().run(); break;
            }
        };

        const handleFindNext = () => {
            if (!searchTerm || !editor) return;
            const { doc } = editor.state;
            let found = false;
            let startPos = editor.state.selection.to;

            const searchFrom = (start: number) => {
                doc.descendants((node, pos) => {
                    if (found) return false;
                    if (node.isText && node.text) {
                        if (pos + node.text.length <= start) return;
                        
                        const textToSearch = pos < start ? node.text.slice(start - pos) : node.text;
                        const regex = new RegExp(searchTerm, 'i');
                        const match = regex.exec(textToSearch);
                        
                        if (match) {
                            const matchStart = Math.max(pos, start) + match.index;
                            editor.chain().focus().setTextSelection({
                                from: matchStart,
                                to: matchStart + match[0].length
                            }).run();
                            found = true;
                            return false;
                        }
                    }
                });
            };

            searchFrom(startPos);
            if (!found) {
                searchFrom(0); // Wrap around
            }
        };

        const handleReplace = () => {
            if (!searchTerm || !editor) return;
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);
            if (selectedText.toLowerCase() === searchTerm.toLowerCase()) {
                editor.chain().focus().insertContent(replaceTerm).run();
            }
            handleFindNext();
        };

        const handleReplaceAll = () => {
            if (!searchTerm || !editor) return;
            let count = 0;
            const matches: {from: number, to: number}[] = [];
            editor.state.doc.descendants((node, pos) => {
                if (node.isText && node.text) {
                    const regex = new RegExp(searchTerm, 'gi');
                    let match;
                    while ((match = regex.exec(node.text)) !== null) {
                        matches.push({
                            from: pos + match.index,
                            to: pos + match.index + match[0].length
                        });
                    }
                }
            });

            if (matches.length === 0) {
                alert('No matches found.');
                return;
            }

            editor.commands.command(({ tr }) => {
                for (let i = matches.length - 1; i >= 0; i--) {
                    tr.insertText(replaceTerm, matches[i].from, matches[i].to);
                    count++;
                }
                return true;
            });
            
            alert(`Replaced ${count} occurrences.`);
        };

        const renderToolbar = () => {
            if (!editor) return null;

            const Button = ({ onClick, isActive, disabled, children, className = '', title = '' }: any) => (
                <button
                    onClick={onClick}
                    disabled={disabled}
                    title={title}
                    className={`p-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } ${className}`}
                >
                    {children}
                </button>
            );

            return (
                <div className="w-full flex flex-col">
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 border-b border-gray-300 rounded-t-lg w-full">
                        <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} disabled={isSourceMode} title="Bold"><Bold size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} disabled={isSourceMode} title="Italic"><Italic size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} disabled={isSourceMode} title="Strikethrough"><Strikethrough size={16} /></Button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} disabled={isSourceMode} title="Heading 1"><Heading1 size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} disabled={isSourceMode} title="Heading 2"><Heading2 size={16} /></Button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} disabled={isSourceMode} title="Bullet List"><List size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} disabled={isSourceMode} title="Ordered List"><ListOrdered size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} disabled={isSourceMode} title="Blockquote"><Quote size={16} /></Button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        <Button onClick={() => editor.chain().focus().undo().run()} disabled={isSourceMode} title="Undo"><Undo size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().redo().run()} disabled={isSourceMode} title="Redo"><Redo size={16} /></Button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} disabled={isSourceMode} title="Align Left"><AlignLeft size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} disabled={isSourceMode} title="Align Center"><AlignCenter size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} disabled={isSourceMode} title="Align Right"><AlignRight size={16} /></Button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        <Button onClick={toggleLink} isActive={editor.isActive('link')} disabled={isSourceMode} title="Set Link"><LinkIcon size={16} /></Button>
                        <Button onClick={() => editor.chain().focus().unsetLink().run()} disabled={isSourceMode || !editor.isActive('link')} title="Unset Link"><Unlink size={16} /></Button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        <Button onClick={insertTable} disabled={isSourceMode} title="Insert Table"><TableIcon size={16} /></Button>
                        {editor.isActive('table') && (
                            <>
                                <select 
                                    onChange={(e) => { 
                                        if (e.target.value) {
                                            handleTableAction(e.target.value); 
                                            e.target.value = ''; 
                                        }
                                    }} 
                                    disabled={isSourceMode}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed h-8"
                                >
                                    <option value="">Table Actions...</option>
                                    <option value="addColumnBefore">Add Column Before</option>
                                    <option value="addColumnAfter">Add Column After</option>
                                    <option value="deleteColumn">Delete Column</option>
                                    <option value="addRowBefore">Add Row Before</option>
                                    <option value="addRowAfter">Add Row After</option>
                                    <option value="deleteRow">Delete Row</option>
                                    <option value="deleteTable">Delete Table</option>
                                    <option value="mergeCells">Merge Cells</option>
                                    <option value="splitCell">Split Cell</option>
                                </select>
                                <select
                                    onChange={(e) => editor.chain().focus().updateAttributes('table', { styleClass: e.target.value }).run()}
                                    value={editor.getAttributes('table').styleClass || 'table-bordered'}
                                    disabled={isSourceMode}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed h-8"
                                >
                                    <option value="table-bordered">Bordered</option>
                                    <option value="table-striped">Striped</option>
                                    <option value="table-no-borders">No Borders</option>
                                </select>
                            </>
                        )}

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        <Button onClick={addImage} disabled={isSourceMode} title="Insert Image"><ImageIcon size={16} /></Button>
                        <Button onClick={addVideo} disabled={isSourceMode} title="Insert Video"><VideoIcon size={16} /></Button>
                        <Button onClick={addAudio} disabled={isSourceMode} title="Insert Audio"><AudioIcon size={16} /></Button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

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
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed h-8"
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
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed h-8"
                            value={editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || ''}
                        >
                            <option value="">Line Height</option>
                            <option value="1">1</option>
                            <option value="1.5">1.5</option>
                            <option value="2">2</option>
                        </select>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <Button onClick={() => setShowSearch(!showSearch)} isActive={showSearch} disabled={isSourceMode} title="Find and Replace"><Search size={16} /></Button>

                        <div className="ml-auto">
                            <Button onClick={toggleSourceMode} isActive={isSourceMode} title="Toggle Source Code">
                                <Code size={16} />
                            </Button>
                        </div>
                    </div>
                    
                    {showSearch && !isSourceMode && (
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b border-gray-300 w-full text-sm">
                            <Search size={14} className="text-gray-500 ml-1" />
                            <input 
                                type="text" 
                                placeholder="Find..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input 
                                type="text" 
                                placeholder="Replace with..." 
                                value={replaceTerm}
                                onChange={(e) => setReplaceTerm(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button onClick={handleFindNext} disabled={!searchTerm} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Find Next</button>
                            <button onClick={handleReplace} disabled={!searchTerm} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Replace</button>
                            <button onClick={handleReplaceAll} disabled={!searchTerm} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Replace All</button>
                            <button onClick={() => setShowSearch(false)} className="ml-auto text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <>
                {toolbarElement && createPortal(renderToolbar(), toolbarElement)}
                
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
