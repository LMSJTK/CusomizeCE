import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { ResizableImage } from '../extensions/ResizableImage';
import { CustomTable } from '../extensions/CustomTable';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { ThreatAttributes } from '../extensions/ThreatAttributes';
import { ThreatMark } from '../extensions/ThreatMark';
import { Video } from '../extensions/Video';
import { Audio } from '../extensions/Audio';
import { FontSize } from '../extensions/FontSize';
import { LineHeight } from '../extensions/LineHeight';
import { Div } from '../extensions/Div';
import { CustomLink } from '../extensions/CustomLink';
import { 
    Bold, Italic, Strikethrough, Heading1, Heading2, 
    List, ListOrdered, Quote, Undo, Redo, 
    AlignLeft, AlignCenter, AlignRight, 
    Image as ImageIcon, Video as VideoIcon, Music as AudioIcon,
    ShieldAlert, ShieldOff, Code,
    Link as LinkIcon, Unlink, Table as TableIcon, Search, GraduationCap
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
        const [aiPrompt, setAiPrompt] = useState('');
        const [isGenerating, setIsGenerating] = useState(false);
        const [showSearch, setShowSearch] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [replaceTerm, setReplaceTerm] = useState('');
        const [mediaModal, setMediaModal] = useState<{isOpen: boolean, type: 'image'|'video'|'audio'|null}>({isOpen: false, type: null});
        const [mediaUrl, setMediaUrl] = useState('');
        const [mediaAlt, setMediaAlt] = useState('');
        const [mediaFile, setMediaFile] = useState<File | null>(null);
        const [threatModal, setThreatModal] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''});
        const [linkModal, setLinkModal] = useState<{isOpen: boolean, url: string, className: string}>({isOpen: false, url: '', className: ''});

        const editor = useEditor({
            extensions: [
                StarterKit,
                ResizableImage.configure({ allowBase64: true }),
                CustomTable.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                TextStyle,
                ThreatAttributes,
                ThreatMark,
                Color,
                Highlight.configure({ multicolor: true }),
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                CustomLink.configure({ openOnClick: false }),
                Video,
                Audio,
                FontSize,
                LineHeight,
                Div,
            ],
            content: content,
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                setSourceHtml(html);
                if (onUpdate) onUpdate(html);
            },
            editorProps: {
                handleClick: (view, pos, event) => {
                    const target = event.target as HTMLElement;
                    const link = target.closest('a');
                    if (link && view.editable) {
                        if (event.ctrlKey || event.metaKey || event.shiftKey) {
                            window.open(link.href, '_blank');
                            return true;
                        }
                        event.preventDefault();
                        return false;
                    }
                    return false;
                },
                handleDoubleClickOn: (view, pos, node, nodePos, event, direct) => {
                    if (node.isText && node.marks) {
                        const linkMark = node.marks.find(m => m.type.name === 'link');
                        if (linkMark) {
                            setLinkModal({ isOpen: true, url: linkMark.attrs.href || '', className: linkMark.attrs.class || '' });
                            return false;
                        }
                    }
                    if (node.type.name === 'image') {
                        setMediaModal({ isOpen: true, type: 'image' });
                        setMediaUrl(node.attrs.src || '');
                        setMediaAlt(node.attrs.alt || '');
                        return false;
                    }
                    if (node.type.name === 'video') {
                        setMediaModal({ isOpen: true, type: 'video' });
                        setMediaUrl(node.attrs.src || '');
                        setMediaAlt(node.attrs.alt || '');
                        return false;
                    }
                    if (node.type.name === 'audio') {
                        setMediaModal({ isOpen: true, type: 'audio' });
                        setMediaUrl(node.attrs.src || '');
                        setMediaAlt(node.attrs.alt || '');
                        return false;
                    }
                    return false;
                },
                handlePaste: (view, event, slice) => {
                    const items = event.clipboardData?.items;
                    if (!items) return false;
                    
                    let handled = false;
                    for (const item of Array.from(items)) {
                        if (item.type.indexOf('image') === 0) {
                            const file = item.getAsFile();
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const src = e.target?.result as string;
                                    const node = view.state.schema.nodes.image.create({ src });
                                    const transaction = view.state.tr.replaceSelectionWith(node);
                                    view.dispatch(transaction);
                                };
                                reader.readAsDataURL(file);
                                handled = true;
                            }
                        }
                    }
                    return handled;
                }
            }
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
            setMediaModal({ isOpen: true, type: 'image' });
        };

        const addVideo = () => {
            setMediaModal({ isOpen: true, type: 'video' });
        };

        const addAudio = () => {
            setMediaModal({ isOpen: true, type: 'audio' });
        };

        const handleMediaSubmit = () => {
            if (!editor || !mediaModal.type) return;

            const insertMedia = (src: string) => {
                if (mediaModal.type === 'image') {
                    editor.chain().focus().setImage({ src, alt: mediaAlt }).run();
                } else if (mediaModal.type === 'video') {
                    editor.chain().focus().setVideo({ src, alt: mediaAlt }).run();
                } else if (mediaModal.type === 'audio') {
                    editor.chain().focus().setAudio({ src, alt: mediaAlt }).run();
                }
                
                setMediaModal({ isOpen: false, type: null });
                setMediaUrl('');
                setMediaAlt('');
                setMediaFile(null);
            };

            if (mediaFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const src = e.target?.result as string;
                    insertMedia(src);
                };
                reader.readAsDataURL(mediaFile);
            } else if (mediaUrl) {
                insertMedia(mediaUrl);
            }
        };

        const toggleLink = () => {
            if (!editor) return;
            if (editor.isActive('link')) {
                const previousUrl = editor.getAttributes('link').href;
                const previousClass = editor.getAttributes('link').class;
                setLinkModal({ isOpen: true, url: previousUrl || '', className: previousClass || '' });
            } else {
                setLinkModal({ isOpen: true, url: '', className: '' });
            }
        };

        const handleLinkSubmit = () => {
            if (!editor) return;
            if (!linkModal.url) {
                editor.chain().focus().unsetLink().run();
            } else {
                if (editor.state.selection.empty) {
                    editor.chain().focus().insertContent(`<a href="${linkModal.url}" class="${linkModal.className}">${linkModal.url}</a>`).run();
                } else {
                    editor.chain().focus().setLink({ href: linkModal.url, class: linkModal.className }).run();
                }
            }
            setLinkModal({ isOpen: false, url: '', className: '' });
        };

        const insertTrainingLink = () => {
            if (!editor) return;
            const url = '{{{trainingURL}}}';
            const className = 'phishing-link-do-not-delete';

            if (editor.state.selection.empty) {
                editor.chain().focus().insertContent(`<a href="${url}" class="${className}">Training Link</a>`).run();
            } else {
                editor.chain().focus().setLink({ href: url, class: className }).run();
            }
        };

        const addThreat = () => {
            if (!editor) return;
            const previousId = editor.getAttributes('threat')['data-threat-id'];
            setThreatModal({ isOpen: true, id: previousId || '' });
        };

        const handleThreatSubmit = () => {
            if (!editor) return;
            
            if (threatModal.id === '') {
                editor.chain().focus().unsetThreat().run();
            } else {
                if (editor.state.selection.empty) {
                    editor.chain().focus().insertContent({
                        type: 'text',
                        text: 'New Threat',
                        marks: [
                            {
                                type: 'threat',
                                attrs: {
                                    'data-cue': 'threat',
                                    'data-threat-id': threatModal.id
                                }
                            }
                        ]
                    }).run();
                } else {
                    editor.chain().focus().setThreat({ 'data-cue': 'threat', 'data-threat-id': threatModal.id }).run();
                }
            }
            setThreatModal({ isOpen: false, id: '' });
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
                        <Button onClick={insertTrainingLink} disabled={isSourceMode} title="Insert Training Link"><GraduationCap size={16} /></Button>

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
                        
                        <Button 
                            onClick={addThreat} 
                            isActive={editor.isActive('threat')}
                            disabled={isSourceMode}
                            title="Add Threat Data"
                        >
                            <ShieldAlert size={16} />
                        </Button>
                        <Button 
                            onClick={() => editor.chain().focus().unsetThreat().run()} 
                            disabled={isSourceMode || !editor.isActive('threat')}
                            title="Remove Threat Data"
                        >
                            <ShieldOff size={16} />
                        </Button>

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

                {mediaModal.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
                            <h3 className="text-lg font-medium mb-4 capitalize">Insert {mediaModal.type}</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                                    <input 
                                        type="file" 
                                        accept={`${mediaModal.type}/*`}
                                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                                
                                <div className="text-center text-sm text-gray-500">OR</div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input 
                                        type="text" 
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder={`https://...`}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                                    <input 
                                        type="text" 
                                        value={mediaAlt}
                                        onChange={(e) => setMediaAlt(e.target.value)}
                                        placeholder="Description for accessibility"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        setMediaModal({isOpen: false, type: null});
                                        setMediaUrl('');
                                        setMediaAlt('');
                                        setMediaFile(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleMediaSubmit}
                                    disabled={!mediaUrl && !mediaFile}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Insert
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {threatModal.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
                            <h3 className="text-lg font-medium mb-4">Set Threat ID</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Threat ID</label>
                                    <input 
                                        type="text" 
                                        value={threatModal.id}
                                        onChange={(e) => setThreatModal({...threatModal, id: e.target.value})}
                                        placeholder="e.g. 123"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button 
                                    onClick={() => setThreatModal({isOpen: false, id: ''})}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleThreatSubmit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {linkModal.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
                            <h3 className="text-lg font-medium mb-4">Edit Link</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input 
                                        type="text" 
                                        value={linkModal.url}
                                        onChange={(e) => setLinkModal({...linkModal, url: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CSS Class (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={linkModal.className}
                                        onChange={(e) => setLinkModal({...linkModal, className: e.target.value})}
                                        placeholder="e.g. phishing-link-do-not-delete"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button 
                                    onClick={() => setLinkModal({isOpen: false, url: '', className: ''})}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleLinkSubmit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }
);
